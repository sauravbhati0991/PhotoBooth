import Image from "next/image";
import Link from "next/link";

interface GridCardProps {
  title: string;
  price: number;
  image?: string;
  count: number;
}

const GridCard = ({ title, price, image, count }: GridCardProps) => {
  return (
    <div className="group relative rounded-3xl overflow-hidden bg-white shadow-xl hover:shadow-2xl transition-all duration-500 hover:-translate-y-2">
      <div className="relative w-full aspect-[6/5] overflow-hidden bg-gray-100">
        {image ? (
          <Image
            src={image}
            alt={title}
            fill
            unoptimized
            className="object-cover transition-transform duration-700 group-hover:scale-110"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Generating preview...
          </div>
        )}
      </div>

      <div className="flex items-center justify-between p-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-800">{title}</h3>
          <p className="text-xl font-bold text-blue-400 mt-1">₹{price}</p>
        </div>

        <Link
          href={{
            pathname: "/editLayout",
            query: {
              title,
              count,
              price,
            },
          }}
          className="px-6 py-2 rounded-xl bg-blue-400 text-white font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:bg-blue-500 hover:scale-105 active:scale-95"
        >
          Select
        </Link>
      </div>
    </div>
  );
};

export default GridCard;
