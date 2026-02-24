import Image from "next/image";
import Link from "next/link";

interface GridCardProps {
  id: number;
  title: string;
  price: number;
  image: string;
}

const GridCard = ({ id, title, price, image }: GridCardProps) => {
  return (
    <div className="group relative rounded-3xl overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      <div className="relative w-full aspect-[7/5] overflow-hidden">
        <Image
          src={image}
          alt={title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
        />
      </div>

      <div className="flex items-center justify-between p-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <p className="text-2xl font-bold text-blue-600 mt-1">₹{price}</p>
        </div>

        <Link
          href={`/payment/${id}`}
          className="px-6 py-2 rounded-xl bg-blue-400 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:bg-blue-500 hover:scale-105 active:scale-95 hover:cursor-pointer"
        >
          Select
        </Link>
      </div>
    </div>
  );
};

export default GridCard;
