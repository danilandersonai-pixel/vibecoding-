"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// «Сообщить о проблеме» в меню: в адрес формы уходит страница, где человек сейчас, — вспоминать её не нужно
export default function ProblemLink() {
  const pathname = usePathname();
  return (
    <Link href={{ pathname: "/problem", query: pathname === "/problem" ? {} : { page: pathname } }} className="underline">
      Сообщить о проблеме
    </Link>
  );
}
