import { FastifyInstance } from "fastify";
import { z } from "zod";
import { randomUUID } from "node:crypto";
import { knex } from "../database";
import { checkSessionIdExists } from "../middlewares/check-session-id-exists";

export async function transactionsRoutes(app: FastifyInstance) {
  app.addHook("preHandler", async (req, rep) => {
    console.log(`[${req.method}] ${req.url}`);
  });

  app.get("/", { preHandler: [checkSessionIdExists] }, async (req) => {
    const { sessionId } = req.cookies;

    const transactions = await knex("transactions")
      .where("session_id", sessionId)
      .select();

    return { transactions };
  });

  app.get("/:id", { preHandler: [checkSessionIdExists] }, async (req) => {
    const getTransactionParamsSchema = z.object({
      id: z.string().uuid(),
    });

    const { id } = getTransactionParamsSchema.parse(req.params);

    const { sessionId } = req.cookies;

    // .first() no final, pois esperamos apenas uma transação com esse id
    const transaction = await knex("transactions")
      .where({
        id,
        session_id: sessionId,
      })
      .first();

    return { transaction };
  });

  app.get("/summary", { preHandler: [checkSessionIdExists] }, async (req) => {
    const { sessionId } = req.cookies;

    const summary = await knex("transactions")
      .where("session_id", sessionId)
      .sum("amount", { as: "amount" })
      .first();

    return { summary };
  });

  app.post("/", async (req, rep) => {
    const createTransactionBodySchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(["credit", "debit"]),
    });

    const { title, amount, type } = createTransactionBodySchema.parse(req.body);

    let sessionId = req.cookies.sessionId;

    if (!sessionId) {
      sessionId = randomUUID();

      rep.cookie("sessionId", sessionId, {
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });
    }

    await knex("transactions").insert({
      id: randomUUID(),
      title,
      amount: type === "credit" ? amount : amount * -1,
      session_id: sessionId,
    });

    return rep.status(201).send();
  });
}
