"use client"

import Image from "next/image"
import { useState } from "react"
import { useRouter } from "next/navigation"
import { AlertCircle, Loader2, Lock, Mail } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setIsLoading(true)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError("E-mail ou senha incorretos")
      setIsLoading(false)
      return
    }

    router.push("/obras")
    router.refresh()
  }

  return (
    <div className="w-full max-w-[400px] space-y-6">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="flex h-14 items-center justify-center rounded-2xl bg-[var(--granum-azul)] px-5 shadow-md">
          <Image
            src="/granum-logo-branco.png"
            alt="Granum"
            width={120}
            height={32}
            className="h-7 w-auto"
            priority
          />
        </div>
        <div>
          <h1 className="text-[20px] font-semibold tracking-tight text-foreground">
            Bem-vindo de volta
          </h1>
          <p className="text-[13px] text-muted-foreground">
            Faça login para acessar o sistema de gestão de obras.
          </p>
        </div>
      </div>

      <Card className="shadow-md">
        <CardContent className="py-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                E-mail
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-9"
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-[12px] font-semibold uppercase tracking-wider text-muted-foreground">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="pl-9"
                  autoComplete="current-password"
                />
              </div>
            </div>

            {error ? (
              <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-[var(--danger-soft)] px-3 py-2 text-[12.5px] text-[var(--danger-ink)]">
                <AlertCircle className="size-4 shrink-0" />
                <span>{error}</span>
              </div>
            ) : null}

            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Entrando…
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <p className="text-center text-[11.5px] text-muted-foreground">
        Granum · Sistema de gestão de obras
      </p>
    </div>
  )
}
