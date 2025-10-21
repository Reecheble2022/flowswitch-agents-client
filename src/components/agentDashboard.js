import React, { useState, useEffect } from 'react';
import {
  useItemsListReadrMutation, 
  useItemFieldsUpdaterMutation, 
  useItemsListReaderQuery, 
  useItemRegistrerMutation,
  useItemDetailsViewerQuery
} from '../backend/api/sharedCrud';
import { useNoteSnap } from '../noteSnapProvider';
import { FaWallet, FaPlus, FaShoppingCart, FaExchangeAlt, FaMoneyCheckAlt, FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import StripeCardForm from './stripeCardForm';

// const STRIPE_PUBLIC_KEY = "pk_test_51SHitEPIjJFMy63fVoKEAI6ja3CA1wlARICPVfG8RNlH6KFMdXh7W36GumW0UIkPNFYUXwb7Von8GitlxV1ocQHl00UmM1OcVc"
const STRIPE_PUBLIC_KEY = "pk_test_51SHitEPIjJFMy63fVoKEAI6ja3CA1wlARICPVfG8RNlH6KFMdXh7W36GumW0UIkPNFYUXwb7Von8GitlxV1ocQHl00UmM1OcVc"
console.log("==>>-STRIPE_PUBLIC_KEY =", STRIPE_PUBLIC_KEY)
const stripePromise = loadStripe(STRIPE_PUBLIC_KEY);

const AgentDashboard = ({ className }) => {
  const { startNoteVerification } = useNoteSnap();
  const [selectedCurrencyObject, setSelectedCurrencyObject] = useState({});
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showBuyVoucherModal, setShowBuyVoucherModal] = useState(false);
  const [showRedeemVoucherModal, setShowRedeemVoucherModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [selectedCurrency, setSelectedCurrency] = useState('');
  const [selectedAmount, setSelectedAmount] = useState('');
  const [voucherId, setVoucherId] = useState('');
  const [redemptionFiatCurrency, setRedemptionFiatCurrency] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [redeemedAmount, setRedeemedAmount] = useState('');
  const [salesAgentId, setSalesAgentId] = useState('');
  const [topUpAmount, setTopUpAmount] = useState('');

  const [submitWalletTopUp, walletTopUpResult] = useItemFieldsUpdaterMutation();
  const { data: updatedWalletData, isLoading: walletTopUpProcessing, isSuccess: walletTopUpSuccess, isError: walletTopUpError, reset: resetWalletTopUp } = walletTopUpResult;
  const { Data: newWalletDetails } = updatedWalletData || {};
  const [submitNewVoucherRequest, newVoucherResult] = useItemRegistrerMutation();
  const { data: newVoucherData, isLoading: newVoucherProcessing, isSuccess: newVoucherSuccess, isError: newVoucherError, reset: resetNewVoucher } = newVoucherResult;
  const { Data: newVoucherDetails } = newVoucherData || {};
  const [submitVoucherRedemptionRequest, voucherRedemptionResult] = useItemRegistrerMutation();
  const { isLoading: voucherRedemptionProcessing, isSuccess: voucherRedemptionSuccess, isError: voucherRedemptionError, reset: resetVoucherRedemption } = voucherRedemptionResult;
  const { data: floatWalletFetchedResponse, refetch: refetchWalletBalance } = useItemDetailsViewerQuery({
    entity: "floatwallet", 
    guid: "pivot",
    filters: { balancePreview: true }
  });
  const { Data: floatWalletForCurrentAgent } = floatWalletFetchedResponse || {};

  const [activeTab, setActiveTab] = useState('visa');
  const [rendering, setRendering] = useState(false);

  const handleBalanceRefetch = () => {
    refetchWalletBalance()
    setRendering(!rendering)
  }

  useEffect(()=>{
    if((walletTopUpSuccess && !walletTopUpProcessing) || (voucherRedemptionSuccess && !voucherRedemptionProcessing)){
      refetchWalletBalance()
    }
  },[walletTopUpSuccess, walletTopUpProcessing, voucherRedemptionSuccess, voucherRedemptionProcessing])
  
  const handleTopUp = (e) => {
    e.preventDefault();
    const paymentMethod = activeTab;
    let details = {};
    if (paymentMethod === 'visa') {
      details = {
        cardNumber: e.target.cardNumber.value,
        expiry: e.target.expiry.value,
        cvv: e.target.cvv.value,
        cardHolder: e.target.cardHolder.value,
      };
    } else if (paymentMethod === 'crypto') {
      details = {
        walletAddress: e.target.walletAddress.value,
        network: e.target.network.value,
        secret: e.target.secret.value,
      };
    }
    submitWalletTopUp({
      entity: "floatwallet",
      guid: "pivot",
      data: {
        fiatCurrency: "ZAR", 
        fiatAmount: parseFloat(e.target.amount.value),
        paymentMethod,
        ...details
      },
    });
  };

  const closeTopUpModal = () => {
    setShowTopUpModal(false);
    setActiveTab('visa');
    setTopUpAmount('');
    resetWalletTopUp();
  };

  useEffect(() => {
    if (!walletTopUpProcessing && walletTopUpSuccess) {
      const timer = setTimeout(closeTopUpModal, 3000);
      return () => clearTimeout(timer);
    }
  }, [walletTopUpProcessing, walletTopUpSuccess]);

  const handleBuyVoucher = (e) => {
    e.preventDefault();
    if (parseFloat(selectedAmount) > getTrustLimit(selectedMerchant)) {
      alert('Voucher value exceeds trust limit for this merchant.');
      return;
    }
    submitNewVoucherRequest({
      entity: "voucher", 
      data: {
        merchantGuid: selectedMerchant,
        voucherFiatValue: selectedAmount,
        fiatCurrency: selectedCurrency
        // voucherCryptoValue,
      }
    })
  };

  const closeBuyVoucherModal = () => {
    setShowBuyVoucherModal(false);
    setSelectedMerchant('');
    setSelectedCurrency('');
    setSelectedAmount('');
    setSelectedCurrencyObject({});
    resetNewVoucher();
  };

  useEffect(() => {
    if (!newVoucherProcessing && newVoucherSuccess) {
      const timer = setTimeout(closeBuyVoucherModal, 3000);
      return () => clearTimeout(timer);
    }
  }, [newVoucherProcessing, newVoucherSuccess]);

  const handleRedeemVoucher = (e) => {
    e.preventDefault();
    if (parseFloat(redeemedAmount) > floatWalletForCurrentAgent?.floatFiatBalance) {
      alert('Insufficient float balance to redeem this amount.');
      return;
    }
    submitVoucherRedemptionRequest({
      entity: "voucherredemption", 
      data: {
        voucherId,
        bookingId,
        fiatAmount: redeemedAmount, 
        fiatCurrency: redemptionFiatCurrency,
      }
    })
  };

  const closeRedeemVoucherModal = () => {
    setShowRedeemVoucherModal(false);
    setVoucherId('');
    setRedeemedAmount('');
    setRedemptionFiatCurrency('');
    setBookingId('');
    resetVoucherRedemption();
  };

  useEffect(() => {
    if (!voucherRedemptionProcessing && voucherRedemptionSuccess) {
      const timer = setTimeout(closeRedeemVoucherModal, 3000);
      return () => clearTimeout(timer);
    }
  }, [voucherRedemptionProcessing, voucherRedemptionSuccess]);

  const handleVerifyCash = () => {
    if (!salesAgentId) {
      alert('Please enter the sales agent ID for verification.');
      return;
    }
    // Trigger note verification with agentID
    startNoteVerification({ agentId: salesAgentId });
  };

  const voucherOptions = [
    {currency: "ZAR", symbol: "R", values: [2000, 10000, 20000, 100000]}, 
    {currency: "USD", symbol: "$", values: [5, 10, 20, 50, 100, 500, 1000]},
    {currency: "UGX", symbol: "X", values: [20000, 40000, 50000, 100000, 500000, 1000000, 5000000, 10000000]},
  ];

  const getTrustLimit = (merchant) => {
    //TODO: In real, fetch based on merchant and user trust score
    return merchant ? 40000000 : 0;
  };
  
  const [fetchAgents, { data: agentsData, isLoading: agentsLoading }] = useItemsListReadrMutation();
  const { Data: agentList } = agentsData || {};
  const [fetchCashNotes, { data: cashNotesResponse, isLoading: cashNotesLoading }] = useItemsListReadrMutation();
  const { Data: cashNotesVerificationsList, totalPages, currentPage } = cashNotesResponse || {};
  const { data:merchantsResponse, isLoading: merchantsLoading } = useItemsListReaderQuery({entity: "merchant"});
  const { Data: merchantsList } = merchantsResponse || {};

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        fetchAgents({ entity: 'agent', filters: { page: 1 } });
      } catch (err) {
        console.log("Error =", err);
      }
    };
    fetchRecords();
  }, [fetchAgents]);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        fetchCashNotes({ entity: 'cashnoteverification', filters: { page: 1 } });
      } catch (err) {
        console.log("Error =", err);
      }
    };
    fetchRecords();
  }, [fetchCashNotes]);

  return (
    <div className={`flex bg-lime-100 w-full flex-grow p-4 sm:p-6 ${className}`}>
      <div className="max-w-7xl mx-auto w-full">
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6 sm:mb-8">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4">Agent Dashboard</h1>
          <div className="flex items-center bg-lime-50 p-3 sm:p-4 rounded-md">
            <FaWallet className="text-lime-600 text-2xl sm:text-3xl mr-3 sm:mr-4" />
            <div>
              <p className="text-gray-600 text-sm sm:text-base">Float Balance</p>
              <p className="text-lg sm:text-2xl font-semibold text-lime-600">R{(floatWalletForCurrentAgent?.floatFiatBalance || 0).toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Top-Up Card */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <FaPlus className="text-lime-600 text-3xl sm:text-4xl mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Top-Up Float</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-4">
              Add funds to your float wallet.
              You can use it to redeem vouchers and earn commission
            </p>
            <button 
              onClick={() => setShowTopUpModal(true)}
              className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 text-sm sm:text-base"
            >
              Top-Up Now
            </button>
          </div>

          {/* Buy Voucher Card */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <FaShoppingCart className="text-lime-600 text-3xl sm:text-4xl mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Get a Sales Voucher</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-4">Acquire a free voucher to sell goods and/or services on behalf of a merchant.</p>
            <button 
              onClick={() => setShowBuyVoucherModal(true)}
              className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 text-sm sm:text-base"
            >
              Create Voucher
            </button>
          </div>

          {/* Redeem Voucher Card */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <FaExchangeAlt className="text-lime-600 text-3xl sm:text-4xl mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Redeem Voucher</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-4">Redeem a voucher from another agent (or your own) using your float.</p>
            <button 
              onClick={() => setShowRedeemVoucherModal(true)}
              className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 text-sm sm:text-base"
            >
              Redeem Now
            </button>
          </div>
        </div>

        {/* ======= start ============================================= */}
        {/* Top-Up Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 sm:p-8 rounded-lg max-w-full sm:max-w-md w-full mx-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Top-Up Float Wallet</h2>
              <div className="flex border-b">
                <button
                  type="button"
                  onClick={() => setActiveTab('visa')}
                  className={`flex-1 py-2 px-4 text-center ${activeTab === 'visa' ? 'border-b-2 border-lime-600 text-lime-600' : 'text-gray-600'}`}
                >
                  Visa Card
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('crypto')}
                  className={`flex-1 py-2 px-4 text-center ${activeTab === 'crypto' ? 'border-b-2 border-lime-600 text-lime-600' : 'text-gray-600'}`}
                >
                  Crypto
                </button>
              </div>

              {activeTab === 'visa' && (
                <Elements stripe={stripePromise}>
                  <StripeCardForm
                    onCancel={closeTopUpModal}
                    targetWalletDetails={floatWalletForCurrentAgent}
                    refetchWalletBalance={handleBalanceRefetch}
                  />
                </Elements>
              )}

              {activeTab === 'crypto' && (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleTopUp({
                    entity: "floatwallet",
                    guid: "pivot",
                    data: {
                      fiatCurrency: "ZAR",
                      fiatAmount: parseFloat(e.target.amount.value),
                      paymentMethod: "crypto",
                      walletAddress: e.target.walletAddress.value,
                      network: e.target.network.value,
                      secret: e.target.secret.value,
                    },
                  });
                }} className="space-y-4">
                  <input
                    type="text"
                    name="walletAddress"
                    placeholder="Crypto Wallet Address"
                    className="w-full px-3 py-2 border rounded text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-lime-600"
                    required
                  />
                  <select
                    name="network"
                    className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                    required
                  >
                    <option value="">Select Network</option>
                    <option value="Tron">Tron</option>
                    <option value="Ethereum">Ethereum</option>
                    <option value="Binance Smart Chain">Binance Smart Chain</option>
                    <option value="Solana">Solana</option>
                  </select>
                  <input
                    type="password"
                    name="secret"
                    placeholder="Wallet Secret/Password"
                    className="w-full px-3 py-2 border rounded text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-lime-600"
                    required
                  />
                  <input
                    type="number"
                    name="amount"
                    placeholder="Amount"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-lime-600"
                    required
                  />
                  <div className="flex flex-col sm:flex-row sm:space-x-2">
                    <button type="submit" disabled={walletTopUpProcessing} className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 text-sm sm:text-base disabled:bg-gray-400">
                      Submit Top-Up
                    </button>
                    <button 
                      type="button" 
                      onClick={closeTopUpModal}
                      className="mt-2 sm:mt-0 text-gray-600 text-sm sm:text-base"
                    >
                      Cancel
                    </button>
                  </div>
                  {walletTopUpProcessing && (
                    <div className="text-center flex items-center justify-center">
                      <FaSpinner className="animate-spin text-lime-600 mr-2" /> Processing...
                    </div>
                  )}
                  {!walletTopUpProcessing && (walletTopUpSuccess || walletTopUpError) && (
                    <div className={`flex items-center justify-between ${walletTopUpSuccess ? 'text-green-600' : 'text-red-600'}`}>
                      <span>
                        {walletTopUpSuccess ? <FaCheck className="inline mr-1" /> : <FaTimes className="inline mr-1" />}
                        {walletTopUpSuccess ? 'Top-Up Successful' : 'Top-Up Failed'}
                      </span>
                      <span onClick={closeTopUpModal} className="cursor-pointer">x</span>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        )}
        {/* ======= end ============================================= */}


        {/* Buy Voucher Modal */}
        {showBuyVoucherModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 sm:p-8 rounded-lg max-w-full sm:max-w-md w-full mx-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Create Sales/Payment Voucher</h2>
              <form onSubmit={handleBuyVoucher} className="space-y-4">
                <div>
                  <label> Select Merchant </label>
                  <select 
                    value={selectedMerchant}
                    onChange={(e) => setSelectedMerchant(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                    required
                  >
                    <option value="">---</option>
                    {(merchantsList || []).map(m => <option key={m.guid || m._id} value={m.guid || m._id}>{m.name}</option>)}
                  </select>
                </div>
                {selectedMerchant && (
                  <p className="text-gray-600 text-sm sm:text-base">Max Trust Limit: {getTrustLimit(selectedMerchant)}</p>
                )}

                <div>
                  <label> Currency </label>
                  <select 
                    value={selectedCurrency}
                    onChange={(e) => {
                      const currency = e.target.value;
                      const currencyObj = voucherOptions.find(v => v.currency === currency) || {};
                      setSelectedCurrency(currency);
                      setSelectedAmount(''); // Reset amount when currency changes
                      setSelectedCurrencyObject(currencyObj);
                    }}
                    className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                    required
                  >
                    <option value="ZAR">ZAR</option>
                  </select>
                </div>

                <div>
                  <label> Select Amount </label>
                  <select 
                    value={selectedAmount}
                    onChange={(e) => setSelectedAmount(e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                    required
                    disabled={!selectedCurrencyObject.values} // Disable if no valid values
                  >
                    <option value="">---</option>
                    {selectedCurrencyObject.values?.map(v => (
                      <option key={`${selectedCurrencyObject.currency}-${v}`} value={v}>
                        {selectedCurrencyObject.symbol}{v}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:space-x-2">
                  <button type="submit" disabled={newVoucherProcessing} className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 text-sm sm:text-base">
                    Create
                  </button>
                  <button 
                    type="button" 
                    onClick={closeBuyVoucherModal}
                    className="mt-2 sm:mt-0 text-gray-600 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
                {newVoucherProcessing && (
                  <div className="text-center flex items-center justify-center">
                    <FaSpinner className="animate-spin text-lime-600 mr-2" /> Processing...
                  </div>
                )}
                {!newVoucherProcessing && (newVoucherSuccess || newVoucherError) && (
                  <div className={`flex items-center justify-between ${newVoucherSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    <span>
                      {newVoucherSuccess ? <FaCheck className="inline mr-1" /> : <FaTimes className="inline mr-1" />}
                      {newVoucherSuccess ? 'Voucher Created Successfully' : 'Voucher Creation Failed'}
                    </span>
                    <span onClick={closeBuyVoucherModal} className="cursor-pointer">x</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}

        {/* Redeem Voucher Modal */}
        {showRedeemVoucherModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 sm:p-8 rounded-lg max-w-full sm:max-w-md w-full mx-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Redeem Voucher</h2>
              <form onSubmit={handleRedeemVoucher} className="space-y-4">
                <input
                  type="text"
                  value={voucherId}
                  onChange={(e) => setVoucherId(e.target.value)}
                  placeholder="Voucher ID"
                  className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                  required
                />
                <input
                  type="number"
                  value={redeemedAmount}
                  onChange={(e) => setRedeemedAmount(e.target.value)}
                  placeholder="Amount to Redeem"
                  className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                  required
                />
                <div>
                  <label> Currency </label>
                  <select 
                    value={redemptionFiatCurrency}
                    onChange={(e) => {
                      const currency = e.target.value;
                      setRedemptionFiatCurrency(currency);
                    }}
                    className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                  >
                    <option value="ZAR">ZAR</option>
                  </select>
                </div>
                <div className="flex flex-col sm:flex-row sm:space-x-2">
                  <button type="submit" disabled={voucherRedemptionProcessing} className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 text-sm sm:text-base">
                    Redeem Voucher
                  </button>
                  <button 
                    type="button" 
                    onClick={closeRedeemVoucherModal}
                    className="mt-2 sm:mt-0 text-gray-600 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
                {voucherRedemptionProcessing && (
                  <div className="text-center flex items-center justify-center">
                    <FaSpinner className="animate-spin text-lime-600 mr-2" /> Processing...
                  </div>
                )}
                {!voucherRedemptionProcessing && (voucherRedemptionSuccess || voucherRedemptionError) && (
                  <div className={`flex items-center justify-between ${voucherRedemptionSuccess ? 'text-green-600' : 'text-red-600'}`}>
                    <span>
                      {voucherRedemptionSuccess ? <FaCheck className="inline mr-1" /> : <FaTimes className="inline mr-1" />}
                      {voucherRedemptionSuccess ? 'Voucher Redeemed Successfully' : 'Voucher Redemption Failed'}
                    </span>
                    <span onClick={closeRedeemVoucherModal} className="cursor-pointer">x</span>
                  </div>
                )}
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;