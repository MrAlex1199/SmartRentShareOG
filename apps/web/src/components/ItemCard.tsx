import Link from 'next/link';
import { Item } from '@repo/shared';

interface ItemCardProps {
  item: Item;
}

export function ItemCard({ item }: ItemCardProps) {
  const ownerName = typeof item.owner === 'object' ? item.owner.displayName : 'Unknown';
  
  return (
    <Link 
      href={`/items/${item._id}`}
      className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-1 block"
    >
      {/* Image */}
      <div className="aspect-video bg-gray-100 relative overflow-hidden">
        {item.images.length > 0 ? (
          <img 
            src={item.images[0]} 
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Category Badge */}
        <div className="absolute top-2 right-2">
          <span className="px-2 py-1 bg-white/90 backdrop-blur-sm text-xs font-medium text-gray-700 rounded-md">
            {item.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-lg text-gray-900 mb-1 line-clamp-1">
          {item.title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {item.description}
        </p>
        
        {/* Price */}
        <div className="flex items-baseline gap-1 mb-3">
          <span className="text-2xl font-bold text-primary">฿{item.dailyPrice}</span>
          <span className="text-sm text-gray-500">/วัน</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {item.location.area}
          </div>
          
          <div className="text-xs text-gray-400">
            {item.condition}
          </div>
        </div>
      </div>
    </Link>
  );
}
