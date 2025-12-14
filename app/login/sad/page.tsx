import Link from "next/link";
import styles from "../page.module.css";

export default function SadPage() {
  return (
    <main className={styles.container}>
      <div className={styles.card}>
        <h2>Üzgün Ayı</h2>
        <p>Bu sayfa "Üzgün" butonuna tıklandığında gösterilir.</p>
        <div style={{ textAlign: "center", marginTop: 16 }}>
          <img src="/bears/sad.png" alt="sad" style={{ width: 160 }} />
        </div>
        <div style={{ marginTop: 18, textAlign: "center" }}>
          <Link href="/login">
            <button className={styles.guestButton}>Geri dön</button>
          </Link>
        </div>
      </div>
    </main>
  );
}
