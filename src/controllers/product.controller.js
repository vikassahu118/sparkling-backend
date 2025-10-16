import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createProduct = asyncHandler(async (req, res) => {
  const { name, category, variants, original_price } = req.body;
  
  // Add validation for the new structure
  if (!name || !category || !original_price || !variants || !Array.isArray(variants) || variants.length === 0) {
    throw new ApiError(400, "Name, category, original_price, and a non-empty variants array are required.");
  }

  const product = await Product.create(req.body);
  return res
    .status(201)
    .json(new ApiResponse(201, product, 'Product and its variants created successfully.'));
});

export const getAllProducts = asyncHandler(async (req, res) => {
  const products = await Product.findAll();
  return res
    .status(200)
    .json(new ApiResponse(200, products, 'Products fetched successfully.'));
});

export const getProductById = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.findById(id);
  if (!product) {
    throw new ApiError(404, 'Product not found.');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, product, 'Product fetched successfully.'));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const productToUpdate = await Product.findById(id);
  if (!productToUpdate) {
    throw new ApiError(404, 'Product not found.');
  }
  
  // This now only updates the base product details. Variant updates would be a separate flow.
  const updatedProductData = { ...productToUpdate, ...req.body };
  
  const product = await Product.update(id, updatedProductData);
  return res
    .status(200)
    .json(new ApiResponse(200, product, 'Product updated successfully.'));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const product = await Product.deactivate(id);
  if (!product) {
    throw new ApiError(404, 'Product not found.');
  }
  return res
    .status(200)
    .json(new ApiResponse(200, product, 'Product deactivated successfully.'));
});
