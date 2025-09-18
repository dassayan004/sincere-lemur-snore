import { MadeWithDyad } from "@/components/made-with-dyad";
import DrawingCanvas from "@/components/drawing-canvas";

export default function Home() {
  return (
    <div className="grid grid-rows-[1fr_auto] items-center justify-items-center min-h-screen p-4 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-8 row-start-1 items-center w-full">
        <h1 className="text-3xl font-bold tracking-tight">Canvas Drawing Zone</h1>
        <DrawingCanvas />
      </main>
      <MadeWithDyad />
    </div>
  );
}