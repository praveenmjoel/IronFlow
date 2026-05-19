"use client";
import dynamic from "next/dynamic";

const FirebaseProvider = dynamic(() => import("@/components/FirebaseProvider"), { ssr: false });

export default function ClientProviders({ children }: { children: React.ReactNode }) {
  return <FirebaseProvider>{children}</FirebaseProvider>;
}
