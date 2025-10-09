import { Product } from '../models/product.model.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);
  return res
    .status(201)
    .json(new ApiResponse(201, product, 'Product created successfully.'));
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
  const existingProduct = await Product.findById(id);
  if (!existingProduct) {
    throw new ApiError(404, 'Product not found.');
  }
  
  // Merge existing data with new data
  const updatedData = { ...existingProduct, ...req.body };
  
  const product = await Product.update(id, updatedData);
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