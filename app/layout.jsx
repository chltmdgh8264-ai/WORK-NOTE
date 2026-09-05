import "./globals.css";

export const metadata = {
  title: "현장 기록장",
  description: "개인 커리어 기록 (비공개)",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
