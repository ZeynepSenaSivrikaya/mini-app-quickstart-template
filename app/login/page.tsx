"use client";

import React, { useState } from "react";
import styles from "./page.module.css";
import { useRouter } from "next/navigation";

import BearButton from "./components/BearButton";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/auth/local", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data?.message || "Giriş başarısız");
        setLoading(false);
        return;
      }

      // On success, redirect to the success page
      router.push("/success");

    } catch (err) {
      setError("Sunucu ile bağlantı kurulamadı");
    } finally {
      setLoading(false);
    }
  }

  const emotions = [
    { key: "sad", label: "Üzgün", img: "/bears/sad.png" },
    { key: "happy", label: "Mutlu", img: "/bears/happy.png" },
    { key: "scared", label: "Korkmuş", img: "/bears/scared.png" },
    { key: "sleepy", label: "Uykulu", img: "/bears/sleepy.png" },
    { key: "love", label: "Aşık", img: "/bears/love.png" },
    { key: "fire", label: "Ateş", img: "/bears/fire.png" },
  ];

  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <div className={styles.brand}>
          <div className={styles.logo}>MİNİ APP</div>
          <p className={styles.subtitle}>Hesabınıza giriş yapın</p>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          <label className={styles.label}>
            Email
            <input
              className={styles.input}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </label>

          <label className={styles.label}>
            Şifre
            <input
              className={styles.input}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Şifreniz"
            />
          </label>

          {error && <div className={styles.error}>{error}</div>}

          <button className={styles.button} disabled={loading}>
            {loading ? "Giriş Yapılıyor..." : "Giriş Yap"}
          </button>

          <button
            type="button"
            className={styles.guestButton}
            onClick={() => {
              try {
                localStorage.setItem("guest", "1");
              } catch (e) {
                // ignore
              }
              router.push("/success");
            }}
          >
            Misafir olarak devam et
          </button>
        </form>

        <div className={styles.emotionSection}>
          <h3 className={styles.emotionTitle}>Duygular (Butonlara tıklayın)</h3>
          <div className={styles.emotionGrid}>
            {emotions.map((em) => (
              <BearButton
                key={em.key}
                label={em.label}
                imgSrc={em.img}
                onClick={() => router.push(`/login/${em.key}`)}
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
