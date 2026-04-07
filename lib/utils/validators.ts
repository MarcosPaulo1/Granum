import { z } from "zod"

export const cpfSchema = z
  .string()
  .regex(/^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$/, "CPF inválido")
  .optional()
  .or(z.literal(""))

export const cnpjSchema = z
  .string()
  .regex(/^\d{2}\.?\d{3}\.?\d{3}\/?\d{4}-?\d{2}$/, "CNPJ inválido")
  .optional()
  .or(z.literal(""))

export const cpfCnpjSchema = z
  .string()
  .refine(
    (val) => {
      if (!val) return true
      const digits = val.replace(/\D/g, "")
      return digits.length === 11 || digits.length === 14
    },
    { message: "CPF ou CNPJ inválido" }
  )
  .optional()
  .or(z.literal(""))

export const phoneSchema = z
  .string()
  .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, "Telefone inválido")
  .optional()
  .or(z.literal(""))

export const emailSchema = z
  .string()
  .email("E-mail inválido")
  .optional()
  .or(z.literal(""))

export const requiredString = z.string().min(1, "Campo obrigatório")

export const requiredNumber = z
  .number({ error: "Informe um número" })
  .positive("Valor deve ser maior que zero")

export const requiredSelect = z
  .number({ error: "Selecione uma opção" })
  .int()
  .positive("Selecione uma opção")

export const optionalDate = z.string().optional().or(z.literal(""))

export const requiredDate = z.string().min(1, "Informe a data")

export const monetaryValue = z
  .number({ error: "Informe um valor" })
  .positive("Valor deve ser maior que zero")
