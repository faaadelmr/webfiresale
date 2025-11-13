'use client';

import { useState } from 'react';
import { LuShoppingCart, LuX, LuPlus, LuMinus } from 'react-icons/lu';

export default function Cart({ isOpen, onClose, items = [], onRemoveItem, onUpdateQuantity }) {
  if (!isOpen) return null;

  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  return (
    <div className="fixed top-0 right-0 h-full w-full md:w-96 bg-gray-800 z-50 shadow-lg transform transition-transform">
      <div className="p-4 border-b border-gray-700 flex items-center justify-between">
        <h2 className="text-xl font-bold">Carrinho</h2>
        <button 
          onClick={onClose}
          className="p-2 rounded-full hover:bg-gray-700"
        >
          <LuX />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="p-8 text-center text-gray-500">
          Seu carrinho está vazio
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto p-4">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-4 py-4 border-b border-gray-700">
                <img 
                  src={item.product.images?.[0] || '/placeholder.jpg'} 
                  alt={item.product.name}
                  className="w-16 h-16 object-cover rounded"
                />
                <div className="flex-1">
                  <h3 className="font-medium">{item.product.name}</h3>
                  <p className="text-green-400 font-bold">Rp{item.price.toFixed(2)}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <button 
                      onClick={() => onUpdateQuantity(item.id, -1)}
                      className="p-1 rounded-full bg-gray-700 hover:bg-gray-600"
                    >
                      <LuMinus size={16} />
                    </button>
                    <span className="w-8 text-center">{item.quantity}</span>
                    <button 
                      onClick={() => onUpdateQuantity(item.id, 1)}
                      className="p-1 rounded-full bg-gray-700 hover:bg-gray-600"
                    >
                      <LuPlus size={16} />
                    </button>
                  </div>
                </div>
                <button 
                  onClick={() => onRemoveItem(item.id)}
                  className="p-2 text-red-400 hover:bg-gray-700 rounded-full"
                >
                  <LuX />
                </button>
              </div>
            ))}
          </div>

          <div className="p-4 border-t border-gray-700">
            <div className="flex justify-between items-center mb-4">
              <span className="font-bold">Total:</span>
              <span className="text-xl font-bold text-green-400">Rp{total.toFixed(2)}</span>
            </div>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold">
              Finalizar Compra
            </button>
          </div>
        </>
      )}
    </div>
  );
}