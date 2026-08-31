import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { checkLessonAccess } from "@/lib/lesson-access";
import { processAutomations } from "@/lib/automation-engine";
import { quizAttemptSchema, validateBody } from "@/lib/validations";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    // 9.173 — o quiz é CONTEÚDO da aula e não tinha gate nenhum: qualquer conta
    // autenticada lia as perguntas de qualquer aula da plataforma.
    // Reuso do predicado que as rotas de MATERIAL já usam (`lesson-access.ts:23-61`),
    // na mesma forma de `materials/route.ts:16-22` — ramos, ordem e códigos idênticos.
    // ⭐ É ele o molde certo porque tem o short-circuit de staff ANTES do vínculo
    // (`:48-51`): o produtor DONO e o ADMIN veem o quiz sem matrícula, e isso é uso
    // REAL — 15 tentativas de 3 donos em produção. Uma régua de "matrícula ATIVA"
    // pura tiraria o quiz da aula do próprio produtor, e o sintoma seria MUDO
    // (`lesson-quiz.tsx:62` faz `r.ok ? json : null` → `:119 return null`).
    const access = await checkLessonAccess(user, params.id);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.status === 404 ? "Aula não encontrada" : "Sem acesso" },
        { status: access.status }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: params.id },
      include: {
        questions: {
          orderBy: { sortOrder: "asc" },
          include: {
            options: {
              orderBy: { sortOrder: "asc" },
              select: { id: true, text: true, sortOrder: true },
            },
          },
        },
      },
    });

    if (!quiz) return NextResponse.json({ quiz: null });

    const lastAttempt = await prisma.quizAttempt.findFirst({
      where: { quizId: quiz.id, userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    // Graceful fallback for a corrupt `answers` blob: keep score/passed
    // (which drive the "already passed → show certificate" gate) and
    // drop only the answer-review UI. Without this the entire quiz GET
    // would 500 on a single bad row and the student would lose access.
    let parsedAnswers: unknown = [];
    if (lastAttempt) {
      try {
        parsedAnswers = JSON.parse(lastAttempt.answers);
      } catch {
        parsedAnswers = [];
      }
    }

    return NextResponse.json({
      quiz: {
        id: quiz.id,
        title: quiz.title,
        passingScore: quiz.passingScore,
        showAnswers: quiz.showAnswers,
        questions: quiz.questions,
      },
      lastAttempt: lastAttempt
        ? { score: lastAttempt.score, passed: lastAttempt.passed, answers: parsedAnswers }
        : null,
    });
  } catch (error) {
    console.error("GET student quiz error:", error);
    return NextResponse.json({ error: "Erro ao buscar quiz" }, { status: 500 });
  }
}

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

    // 9.173 — MESMA régua do GET, e do material: o POST escreve `QuizAttempt` e
    // dispara `processAutomations`, então ele não pode ser mais frouxo que a leitura.
    // ⓘ A consulta abaixo NÃO é redundante com `access.courseId`: ela precisa também
    // de `workspaceId` para `processAutomations`, e das perguntas para corrigir.
    const access = await checkLessonAccess(user, params.id);
    if (!access.ok) {
      return NextResponse.json(
        { error: access.status === 404 ? "Aula não encontrada" : "Sem acesso" },
        { status: access.status }
      );
    }

    const quiz = await prisma.quiz.findUnique({
      where: { lessonId: params.id },
      include: {
        questions: {
          include: { options: true },
        },
        lesson: {
          select: { module: { select: { course: { select: { id: true, workspaceId: true } } } } },
        },
      },
    });

    if (!quiz) return NextResponse.json({ error: "Quiz não encontrado" }, { status: 404 });

    const raw = await request.json().catch(() => ({}));
    const v = validateBody(quizAttemptSchema, raw);
    if (!v.success) return v.error;
    const submittedAnswers = v.data.answers;

    if (submittedAnswers.length !== quiz.questions.length) {
      return NextResponse.json({ error: "Responda todas as perguntas" }, { status: 400 });
    }

    const results = quiz.questions.map((q) => {
      const answer = submittedAnswers.find((a) => a.questionId === q.id);
      const correctOption = q.options.find((o) => o.isCorrect);
      const isCorrect = answer?.selectedOptionId === correctOption?.id;
      return {
        questionId: q.id,
        selectedOptionId: answer?.selectedOptionId ?? null,
        // 9.173 — o gabarito só sai quando o produtor LIGOU a revisão de respostas.
        // Antes ele saía sempre: um POST com respostas quaisquer devolvia
        // `correctOptionId` de todas as questões (o `:93` exige responder tudo, não
        // acertar nada). ⓘ Invisível para a tela: `lesson-quiz.tsx:128-133` já se
        // ramifica em `showAnswers`, e o ramo `else` (:131-132) usa SÓ
        // `selectedOptionId` e `isCorrect` — nunca `correctOptionId`.
        correctOptionId: quiz.showAnswers ? correctOption?.id ?? null : null,
        isCorrect,
      };
    });

    const correctCount = results.filter((r) => r.isCorrect).length;
    const score = Math.round((correctCount / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    await prisma.quizAttempt.create({
      data: {
        quizId: quiz.id,
        userId: user.id,
        score,
        passed,
        answers: JSON.stringify(results),
      },
    });

    prisma.user.update({ where: { id: user.id }, data: { lastAccessAt: new Date() } }).catch(() => {});

    if (passed && quiz.lesson) {
      const course = quiz.lesson.module.course;
      processAutomations({
        type: "QUIZ_PASSED",
        workspaceId: course.workspaceId,
        courseId: course.id,
        userId: user.id,
        data: { quizId: quiz.id, score },
      }).catch(() => {});
    }

    return NextResponse.json({ score, passed, total: quiz.questions.length, correct: correctCount, results });
  } catch (error) {
    console.error("POST student quiz error:", error);
    return NextResponse.json({ error: "Erro ao enviar respostas" }, { status: 500 });
  }
}
