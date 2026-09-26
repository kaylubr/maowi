from server.db import session as db_session_module
from server.modules.models import Module, ModuleStatus
from server.questions import generation, service


def generate_module_questions(module_id: int) -> None:
    with db_session_module.SessionLocal() as db:
        module = db.get(Module, module_id)
        if module is None or module.status != ModuleStatus.generating:
            return

        material = service.collect_module_material(db, module)
        try:
            generated = generation.generate_questions(material)
        except Exception as error:
            module.status = ModuleStatus.failed
            module.error_message = str(error)
            db.commit()
            return

        if not generated:
            module.status = ModuleStatus.failed
            module.error_message = "The AI did not return any usable questions"
            db.commit()
            return

        service.create_questions(db, module, generated)
        module.status = ModuleStatus.ready
        module.error_message = None
        db.commit()
