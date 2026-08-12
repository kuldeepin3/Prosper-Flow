import "./globals.css";

export const metadata = {
  title: "Antigravity - AI Personal Finance Management Engine",
  description: "AI-Powered Personal Expense, Income, Savings, and Investment Tracker",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}

