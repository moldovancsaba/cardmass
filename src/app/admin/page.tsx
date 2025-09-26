import { notFound } from "next/navigation";

// Global /admin route removed. Return 404 for anonymity and to avoid leaked navigation.
export default function AdminPage() {
  return notFound();
}
