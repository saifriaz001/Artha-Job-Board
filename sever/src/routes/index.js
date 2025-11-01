
import { Router } from "express";
import { triggerAll, triggerSome, history } from "../controllers/import.controller.js"


const router = Router();

router.post("/import/trigger", triggerAll);
router.post("/import/feeds", triggerSome);
router.get("/import-history", history);

export default router;
