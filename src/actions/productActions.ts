'use server';

import { requireRole } from '@/lib/auth';
import { isValidProductData } from '@/lib/security';
import prisma from '@/lib/prisma';
import { Product } from '@prisma/client';
import { Decimal } from 'decimal.js';

// Define the return type for product actions
type ProductActionResult =
  | {
      success: true;
      products: any[];
    }
  | {
      success: false;
      message: string;
      products?: never;
    };

// Server action to get all products - only for superadmin and admin roles
export async function getAllProductsAction(): Promise<ProductActionResult> {
  try {
    // Allow access to superadmin and admin roles
    await requireRole(['superadmin', 'admin']);

    // Get all products from the database
    const products = await prisma.product.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Convert Decimal values to numbers for client compatibility
    const productsWithNumericValues = products.map(product => ({
      ...product,
      originalPrice: Number(product.originalPrice),
    }));

    return { success: true, products: productsWithNumericValues };
  } catch (error) {
    console.error('Error fetching products:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch products'
    };
  }
}

// Server action to get a product by ID - only for superadmin and admin roles
export async function getProductByIdAction(productId: string) {
  try {
    // Allow access to superadmin and admin roles
    await requireRole(['superadmin', 'admin']);

    // Validate product ID format
    if (!productId || typeof productId !== 'string') {
      return { success: false, message: 'Invalid product ID' };
    }

    // Get product by ID
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return { success: false, message: 'Product not found' };
    }

    // Convert Decimal values to numbers for client compatibility
    const productWithNumericValues = {
      ...product,
      originalPrice: Number(product.originalPrice),
    };

    return { success: true, product: productWithNumericValues };
  } catch (error) {
    console.error('Error fetching product:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to fetch product'
    };
  }
}

// Server action to create a new product - only for superadmin and admin roles
export async function createProductAction(productData: {
  name: string;
  description: string;
  image: string;
  originalPrice: number;
  quantityAvailable: number;
  weight: number;
}) {
  try {
    // Only allow superadmin and admin roles to create products
    await requireRole(['superadmin', 'admin']);

    // Validate product data
    const validation = isValidProductData(productData);
    if (!validation.isValid) {
      return { success: false, message: validation.error };
    }

    // Create the product in the database
    const product = await prisma.product.create({
      data: {
        name: productData.name,
        description: productData.description,
        image: productData.image,
        originalPrice: new Decimal(productData.originalPrice),
        quantityAvailable: productData.quantityAvailable,
        weight: productData.weight,
      },
    });

    // Convert Decimal values to numbers for client compatibility
    const productWithNumericValues = {
      ...product,
      originalPrice: Number(product.originalPrice),
    };

    return { success: true, message: 'Product created successfully', product: productWithNumericValues };
  } catch (error) {
    console.error('Error creating product:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to create product'
    };
  }
}

// Server action to update a product - only for superadmin and admin roles
export async function updateProductAction(productId: string, productData: {
  name?: string;
  description?: string;
  image?: string;
  originalPrice?: number;
  quantityAvailable?: number;
  weight?: number;
}) {
  try {
    // Only allow superadmin and admin roles to update products
    await requireRole(['superadmin', 'admin']);

    // Validate product ID
    if (!productId || typeof productId !== 'string') {
      return { success: false, message: 'Invalid product ID' };
    }

    // Validate product data if provided
    if (Object.keys(productData).length > 0) {
      // Create a temporary object to validate
      const tempData = {
        ...productData,
      };
      const validation = isValidProductData(tempData);
      if (!validation.isValid) {
        return { success: false, message: validation.error };
      }
    }

    // Update the product in the database
    const updatedProduct = await prisma.product.update({
      where: { id: productId },
      data: {
        ...(productData.name !== undefined && { name: productData.name }),
        ...(productData.description !== undefined && { description: productData.description }),
        ...(productData.image !== undefined && { image: productData.image }),
        ...(productData.originalPrice !== undefined && { originalPrice: new Decimal(productData.originalPrice) }),
        ...(productData.quantityAvailable !== undefined && { quantityAvailable: productData.quantityAvailable }),
        ...(productData.weight !== undefined && { weight: productData.weight }),
      },
    });

    // Convert Decimal values to numbers for client compatibility
    const updatedProductWithNumericValues = {
      ...updatedProduct,
      originalPrice: Number(updatedProduct.originalPrice),
    };

    return { success: true, message: 'Product updated successfully', product: updatedProductWithNumericValues };
  } catch (error) {
    console.error('Error updating product:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update product'
    };
  }
}

// Server action to delete a product - only for superadmin and admin roles
export async function deleteProductAction(productId: string) {
  try {
    // Only allow superadmin and admin roles to delete products
    await requireRole(['superadmin', 'admin']);

    // Validate product ID
    if (!productId || typeof productId !== 'string') {
      return { success: false, message: 'Invalid product ID' };
    }

    // Delete the product from the database
    await prisma.product.delete({
      where: { id: productId },
    });

    return { success: true, message: 'Product deleted successfully' };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to delete product' 
    };
  }
}