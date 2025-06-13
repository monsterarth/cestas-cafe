interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = "Carregando cardápio..." }: LoadingScreenProps) {
  return (
    <div className="fixed inset-0 flex flex-col justify-center items-center z-50 bg-[#F7FDF2]">
      <div className="w-10 h-10 border-4 border-gray-300 border-t-[#97A25F] rounded-full animate-spin"></div>
      <p className="mt-4 text-lg text-[#4B4F36]">{message}</p>
    </div>
  )
}
