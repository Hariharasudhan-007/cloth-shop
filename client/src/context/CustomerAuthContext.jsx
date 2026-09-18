import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const CustomerAuthContext = createContext();

export function CustomerAuthProvider({ children }) {
  const [customer, setCustomer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savedAddresses, setSavedAddresses] = useState([]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const data = await api.getCustomerMe();
        if (data && data.user) {
          setCustomer(data.user);
          loadAddresses();
        }
      } catch (err) {
        setCustomer(null);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const loadAddresses = async () => {
    try {
      const addrs = await api.getCustomerAddresses();
      setSavedAddresses(addrs || []);
    } catch (e) {
      // Ignored if not authenticated
    }
  };

  const login = async (email, password) => {
    const res = await api.customerLogin(email, password);
    if (res.user) {
      setCustomer(res.user);
      loadAddresses();
    }
    return res;
  };

  const register = async (payload) => {
    const res = await api.customerRegister(payload);
    if (res.user) {
      setCustomer(res.user);
      loadAddresses();
    }
    return res;
  };

  const logout = async () => {
    try {
      await api.customerLogout();
    } catch (e) {
      // Ignore
    }
    setCustomer(null);
    setSavedAddresses([]);
  };

  const addAddress = async (addrData) => {
    const res = await api.saveCustomerAddress(addrData);
    await loadAddresses();
    return res;
  };

  const removeAddress = async (id) => {
    await api.deleteCustomerAddress(id);
    await loadAddresses();
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        loading,
        isCustomerAuthenticated: !!customer,
        login,
        register,
        logout,
        savedAddresses,
        loadAddresses,
        addAddress,
        removeAddress
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
