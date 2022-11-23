import { useEffect, useReducer } from 'react';
import { ICartProduct } from '../../interfaces';
import { CartContext, cartReducer } from './';
import Cookie from 'js-cookie';

export interface CartState {
  cart: ICartProduct[];
}

const CART_INITIAL_STATE: CartState = {
  cart: [],
};

interface Props {
  children: React.ReactNode;
}

export const CartProvider: React.FC<Props> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, CART_INITIAL_STATE);

  // Add to Cart from Cookie:
  useEffect(() => {
    try {
      const cartProductsFromCookie = Cookie.get('cart') ? JSON.parse(Cookie.get('cart')!) : [];

      dispatch({
        type: '[CART] - LoadCart from cookies | storage',
        payload: cartProductsFromCookie,
      });
    } catch (error) {
      // Si existe algun problema al parsear las cookies se envia al state un array vacio:
      dispatch({ type: '[CART] - LoadCart from cookies | storage', payload: [] });
    }
  }, []);
  console.log('State useEffect1:', state); //! Array vacio al recargar 🤒 SOLUCION: desactivar reactStrictMode en el file next.config.js o implementar un useState isMounted

  useEffect(() => {
    Cookie.set('cart', JSON.stringify(state.cart));
  }, [state.cart]);
  console.log('State useEffect2:', state); //! Array vacio al recargar 🤒 SOLUCION: desactivar reactStrictMode en el file next.config.js o implementar un useState isMounted

  const addProductToCart = (product: ICartProduct) => {
    //* Nivel 1: No funciona porque guarda cada producto aparte y no acumula la cantidad en el mismo producto (repeticion del mismo producto)

    // dispatch({ type: '[CART] - Updated products in cart', payload: product });

    //* Nivel 2: Tampoco funcionaría

    // const productInCart = state.cart.filter(p => p._id !== product._id && p.size !== product.size);
    // dispatch({ type: '[CART] - Updated products in cart', payload: [...productInCart, product] });

    // ? Nivel final: Si funciona
    const productInCart = state.cart.some(p => p._id === product._id);
    if (!productInCart) {
      return dispatch({
        type: '[CART] - Updated products in cart',
        payload: [...state.cart, product],
      });
    }

    const productInCartButDifferentSize = state.cart.some(
      p => p._id === product._id && p.size === product.size
    );
    if (!productInCartButDifferentSize) {
      return dispatch({
        type: '[CART] - Updated products in cart',
        payload: [...state.cart, product],
      });
    }

    // Acumular
    const updatedProducts = state.cart.map(p => {
      if (p._id !== product._id) return p;
      if (p.size !== product.size) return p;

      // Actualizar la cantidad:
      p.quantity += product.quantity;
      return p;
    });

    dispatch({
      type: '[CART] - Updated products in cart',
      payload: updatedProducts,
    });
  };

  return (
    <CartContext.Provider
      value={{
        ...state,
        // Methods
        addProductToCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};
