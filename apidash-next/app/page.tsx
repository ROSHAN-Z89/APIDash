import { Button } from "@/components/ui/button";
import Link from 'next/link'

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen py-2">
      <h1 className="text-4xl font-bold">Welcome to Apidash Next.js!</h1>
      <p className="mt-4 text-lg text-gray-600">
        This is the home page of your Next.js application. You can start building your app by editing this page.
      </p>
      <Button render={<Link href="/dash" />} >
        Get Started
      </Button>
    </div>
  );
}
