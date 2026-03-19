import ChurchForm from "@/components/ChurchForm";

export default function Home() {
  return (
    <main className="min-h-screen p-4 sm:p-8 flex justify-center items-start bg-gray-100">
      <div className="w-full max-w-4xl bg-white rounded-xl shadow-lg mt-8 p-6 sm:p-10 mb-20 overflow-x-hidden">
        <ChurchForm />
      </div>
    </main>
  );
}
