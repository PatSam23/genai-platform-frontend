import ChatWindow from "@/components/ChatWindow";

export default function Home() {
  // Added "h-full" to ensure the page container fills the Layout's flex-1 slot
  return (
    <div className="h-full w-full">
      <ChatWindow />
    </div>
  );
}