
"use client";

import { useState, useEffect } from "react";
import { Search, Plus, Edit, Trash2, DollarSign, Image as ImageIcon, Upload } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAllProductsAction,
  createProductAction,
  updateProductAction,
  deleteProductAction
} from "@/actions/productActions";

// Define the Product type to match Prisma schema
type Product = {
  id: string;
  name: string;
  description: string;
  image: string;
  originalPrice: number;
  quantityAvailable: number; // Changed from quantity to match Prisma schema
  weight: number;
  createdAt: string;
  updatedAt: string;
};

const fileToDataUri = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product> | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch products from database
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const result = await getAllProductsAction();
        if (result.success && result.products) {
          // Transform dates to strings to match the type
          const transformedProducts = result.products.map(product => ({
            ...product,
            createdAt: product.createdAt.toISOString(),
            updatedAt: product.updatedAt.toISOString(),
          }));
          setProducts(transformedProducts);
        } else {
          setError(result.message || 'Failed to fetch products');
        }
      } catch (err) {
        setError('Error loading products');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    let result = products;
    if (searchTerm) {
      result = result.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    setFilteredProducts(result);
  }, [searchTerm, products]);

  const handleAddProduct = () => {
    setIsEditing(false);
    setCurrentProduct({
      name: "",
      description: "",
      image: "",
      originalPrice: 0,
      quantityAvailable: 0,
      weight: 0,
    });
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setIsEditing(true);
    setCurrentProduct({ ...product });
    setImagePreview(product.image);
    setIsDialogOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProductToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteProduct = async () => {
    if (productToDelete) {
      try {
        const result = await deleteProductAction(productToDelete);
        if (result.success) {
          // Refresh the product list
          const updatedProducts = products.filter(p => p.id !== productToDelete);
          setProducts(updatedProducts);
        } else {
          setError(result.message || 'Failed to delete product');
        }
      } catch (err) {
        setError('Error deleting product');
        console.error(err);
      }
      setIsDeleteDialogOpen(false);
      setProductToDelete(null);
    }
  };

  const saveProduct = async () => {
    if (!currentProduct || !currentProduct.name || !currentProduct.image) return;

    try {
      let result;

      if (isEditing && currentProduct.id) {
        // Update existing product
        result = await updateProductAction(currentProduct.id, {
          name: currentProduct.name,
          description: currentProduct.description || "",
          image: currentProduct.image,
          originalPrice: currentProduct.originalPrice || 0,
          quantityAvailable: currentProduct.quantityAvailable || 0,
          weight: currentProduct.weight || 0,
        });
      } else {
        // Create new product
        result = await createProductAction({
          name: currentProduct.name,
          description: currentProduct.description || "",
          image: currentProduct.image,
          originalPrice: currentProduct.originalPrice || 0,
          quantityAvailable: currentProduct.quantityAvailable || 0,
          weight: currentProduct.weight || 0,
        });
      }

      if (result.success) {
        // Refresh the product list
        const fetchResult = await getAllProductsAction();
        if (fetchResult.success && fetchResult.products) {
          const transformedProducts = fetchResult.products.map(product => ({
            ...product,
            createdAt: product.createdAt.toISOString(),
            updatedAt: product.updatedAt.toISOString(),
          }));
          setProducts(transformedProducts);
          setIsDialogOpen(false);
        } else {
          setError(fetchResult.message || 'Failed to refresh products after save');
        }
      } else {
        setError(result.message || 'Failed to save product');
      }
    } catch (err) {
      setError('Error saving product');
      console.error(err);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      try {
        const dataUri = await fileToDataUri(file);
        setCurrentProduct(prev => ({ ...prev!, image: dataUri }));
        setImagePreview(dataUri);
      } catch (error) {
        console.error("Error converting file to data URI", error);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Manajemen Produk</h1>
          <p className="text-base-content/70">Tambah, edit, dan hapus produk dari toko Anda.</p>
        </div>
        <button className="btn btn-primary" onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Produk
        </button>
      </div>

      <div className="bg-base-100 rounded-xl border border-base-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-base-200">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <h2 className="text-xl font-semibold">Daftar Produk</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
              <input
                type="search"
                placeholder="Cari produk..."
                className="input input-bordered w-full md:w-64 pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
            <table className="table">
              <thead>
                <tr>
                  <th>Produk</th>
                  <th>Deskripsi</th>
                  <th>Harga Asli</th>
                  <th>Stok</th>
                  <th>Berat (g)</th>
                  <th className="text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr key={product.id} className="hover">
                      <td className="font-medium">
                        <div className="flex items-center gap-4">
                          <Image
                            src={product.image}
                            alt={product.name}
                            width={64}
                            height={64}
                            className="rounded-md object-cover w-16 h-16"
                          />
                          <div>
                            <div>{product.name}</div>
                            <div className="text-xs text-base-content/60">ID: {product.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="max-w-xs truncate">{product.description}</td>
                      <td>{formatPrice(product.originalPrice)}</td>
                      <td>
                        <div className="badge badge-neutral">{product.quantityAvailable}</div>
                      </td>
                      <td>
                        <div className="badge badge-ghost">{product.weight}g</div>
                      </td>
                      <td className="text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            className="btn btn-outline btn-sm"
                            onClick={() => handleEditProduct(product)}
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            className="btn btn-error btn-sm"
                            onClick={() => handleDeleteProduct(product.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="text-center text-base-content/60 py-8">
                      {error ? `Error: ${error}` : 'Belum ada produk. Tambahkan produk baru untuk memulai.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
      </div>

      {/* Product Dialog */}
      <AnimatePresence>
        {isDialogOpen && (
           <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-base-100 rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
            <h3 className="text-lg font-semibold">{isEditing ? "Edit Produk" : "Tambah Produk Baru"}</h3>
            <p className="text-sm text-base-content/60 mb-4">{isEditing ? "Ubah informasi produk yang dipilih" : "Tambahkan produk baru ke toko Anda"}</p>
            <div className="space-y-4">
                <div className="form-control">
                    <label className="label">
                      <span className="label-text">Nama Produk</span>
                    </label>
                    <input
                      id="name"
                      value={currentProduct?.name || ""}
                      onChange={(e) => setCurrentProduct({ ...currentProduct!, name: e.target.value })}
                      placeholder="Masukkan nama produk"
                      className="input input-bordered w-full"
                    />
                </div>
                <div className="form-control">
                    <label className="label">
                      <span className="label-text">Deskripsi Produk</span>
                    </label>
                    <textarea
                      id="description"
                      value={currentProduct?.description || ""}
                      onChange={(e) => setCurrentProduct({ ...currentProduct!, description: e.target.value })}
                      placeholder="Deskripsikan produk secara detail"
                      rows={3}
                      className="textarea textarea-bordered w-full"
                    />
                </div>
                <div className="form-control">
                    <label className="label">
                      <span className="label-text">Gambar Produk</span>
                    </label>
                    <div className="flex items-center gap-4">
                        <div className="w-24 h-24 border rounded-md flex items-center justify-center bg-base-200">
                        {imagePreview ? (
                            <Image
                              src={imagePreview}
                              alt="Product image preview"
                              width={96}
                              height={96}
                              className="rounded-md object-cover w-full h-full"
                            />
                        ) : (
                            <ImageIcon className="h-8 w-8 text-base-content/50" />
                        )}
                        </div>
                        <input
                          id="image-upload"
                          type="file"
                          className="hidden"
                          onChange={handleImageUpload}
                          accept="image/*"
                        />
                        <label
                          htmlFor="image-upload"
                          className="btn btn-outline cursor-pointer"
                        >
                            <Upload className="mr-2 h-4 w-4" /> Unggah Gambar
                        </label>
                    </div>
                </div>
                <div className="form-control">
                    <label className="label">
                      <span className="label-text">Harga Asli</span>
                    </label>
                    <div className="relative">
                        <DollarSign className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-base-content/50" />
                        <input
                          id="originalPrice"
                          type="number"
                          value={currentProduct?.originalPrice || 0}
                          onChange={(e) => setCurrentProduct({ ...currentProduct!, originalPrice: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="input input-bordered w-full pl-8"
                        />
                    </div>
                </div>
                <div className="form-control">
                    <label className="label">
                      <span className="label-text">Jumlah Stok</span>
                    </label>
                    <input
                      id="quantity"
                      type="number"
                      value={currentProduct?.quantityAvailable || 0}
                      onChange={(e) => setCurrentProduct({ ...currentProduct!, quantityAvailable: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="input input-bordered w-full"
                    />
                </div>
                <div className="form-control">
                    <label className="label">
                      <span className="label-text">Berat Produk (gram)</span>
                    </label>
                    <input
                      id="weight"
                      type="number"
                      value={currentProduct?.weight || 0}
                      onChange={(e) => setCurrentProduct({ ...currentProduct!, weight: parseInt(e.target.value) || 0 })}
                      placeholder="0"
                      className="input input-bordered w-full"
                    />
                </div>
            </div>
            <div className="flex justify-end gap-2 pt-6">
                <button
                  className="btn btn-ghost"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Batal
                </button>
                <button
                  className="btn btn-primary"
                  onClick={saveProduct}
                  disabled={!currentProduct?.name || !currentProduct.image}
                >
                {isEditing ? "Perbarui" : "Simpan"}
                </button>
            </div>
          </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Dialog */}
       <AnimatePresence>
        {isDeleteDialogOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="bg-base-100 rounded-xl p-6 w-full max-w-md"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
            >
              <h3 className="text-lg font-semibold">Hapus Produk</h3>
              <p className="py-4">Apakah Anda yakin ingin menghapus produk ini? Produk yang terkait dengan flash sale aktif mungkin akan terpengaruh. Tindakan ini tidak dapat dibatalkan.</p>
              <div className="flex justify-end gap-2">
                <button
                  className="btn btn-ghost"
                  onClick={() => setIsDeleteDialogOpen(false)}
                >
                  Batal
                </button>
                <button
                  className="btn btn-error"
                  onClick={confirmDeleteProduct}
                >
                  Hapus
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
