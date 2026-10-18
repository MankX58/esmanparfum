"use client";

import { sileo } from "sileo";
import { buttonStyles } from "@/components/button";
import { Field, fieldProps, inputStyles } from "@/components/field";
import { useServerForm } from "@/lib/use-server-form";
import { answerQuote } from "./actions";

// Respuesta a una cotización: precio y nota. Si ya se respondió, muestra lo guardado para corregirlo.
// En la página hay un formulario por cotización, por eso el id de cada campo lleva su número.
export function AnswerForm({
  quoteId,
  price,
  answer,
  answered,
}: {
  quoteId: number;
  price: number | null;
  answer: string | null;
  answered: boolean;
}) {
  const { state, pending, busy, handleSubmit } = useServerForm(answerQuote.bind(null, quoteId), () => {
    sileo.success({ title: "Respuesta enviada", description: "El cliente la ve en la tienda y le llega por correo." });
  });
  const errors = state.errors ?? {};
  const priceId = `price-${quoteId}`;
  const answerId = `answer-${quoteId}`;

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {state.message && (
        <p role="alert" className="text-sm text-danger">
          {state.message}
        </p>
      )}
      <Field label="Precio" name={priceId} error={errors.price} hint="En pesos, sin decimales. Déjalo vacío si no lo consigues.">
        <input
          {...fieldProps(priceId, errors.price)}
          name="price"
          inputMode="numeric"
          defaultValue={price ?? ""}
          className={`${inputStyles} h-11`}
        />
      </Field>
      <Field label="Nota para el cliente" name={answerId} error={errors.answer} hint="Tamaño, tiempo de entrega o por qué no se consigue.">
        <textarea
          {...fieldProps(answerId, errors.answer)}
          name="answer"
          rows={2}
          maxLength={500}
          defaultValue={answer ?? ""}
          className={`${inputStyles} py-2.5 leading-relaxed`}
        />
      </Field>
      <button type="submit" disabled={busy} className={`self-start ${answered ? buttonStyles.secondary : buttonStyles.primary}`}>
        {pending ? "Guardando…" : answered ? "Actualizar respuesta" : "Responder"}
      </button>
    </form>
  );
}
