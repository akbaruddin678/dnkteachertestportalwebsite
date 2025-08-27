import "./index.css";

export const metadata = {
  title: "Nclex LMS - Admin Panel",
  description: "Admin panel for Nclex Learning Management System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
