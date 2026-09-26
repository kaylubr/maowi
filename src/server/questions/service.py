import random

from sqlalchemy import select
from sqlalchemy.orm import Session

from server.files.models import File
from server.modules.models import Module
from server.questions.models import Question
from server.questions.schemas import QuestionMode


def get_question(db: Session, question_id: int) -> Question | None:
    return db.get(Question, question_id)


def list_module_questions(
    db: Session,
    module_id: int,
    count: int | None = None,
) -> list[Question]:
    statement = (
        select(Question)
        .where(Question.module_id == module_id)
        .order_by(Question.id)
    )
    questions = list(db.scalars(statement))

    if count is None or count >= len(questions):
        return questions
    return random.sample(questions, count)


def collect_module_material(db: Session, module: Module) -> str:
    statement = (
        select(File)
        .where(File.module_id == module.id, File.parsed_text.is_not(None))
        .order_by(File.id)
    )
    return "\n\n".join(file.parsed_text for file in db.scalars(statement))


def create_questions(
    db: Session,
    module: Module,
    generated: list[dict],
) -> list[Question]:
    questions = [
        Question(
            module_id=module.id,
            prompt=item["prompt"],
            answer=item["answer"],
            distractors=item["distractors"],
        )
        for item in generated
    ]
    db.add_all(questions)
    db.commit()
    return questions


def build_options(question: Question) -> list[str]:
    options = [question.answer, *question.distractors]
    random.shuffle(options)
    return options


def serialize_question(question: Question, mode: QuestionMode) -> dict:
    if mode == QuestionMode.flashcard:
        return {
            "id": question.id,
            "prompt": question.prompt,
            "answer": question.answer,
        }

    if mode == QuestionMode.mcq:
        return {
            "id": question.id,
            "prompt": question.prompt,
            "options": build_options(question),
        }

    return {"id": question.id, "prompt": question.prompt}
