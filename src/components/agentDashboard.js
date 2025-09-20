import React, { useState, useEffect } from 'react';
import { useItemsListReadrMutation } from '../backend/api/sharedCrud';
import { useNoteSnap } from '../noteSnapProvider';
import { useUserLocation } from "../userLocationProvider";
import { useAgentRegistration } from "../agentRegistrationProvider";
import { useAgentVerificationScheduling } from "../agentVerificationScheduleProvider";
import { FaWallet, FaPlus, FaShoppingCart, FaExchangeAlt, FaMoneyCheckAlt } from 'react-icons/fa';

const AgentDashboard = ({ className }) => {
  const { startNoteVerification } = useNoteSnap();
  const { triggerHomeVerificationPrompt } = useUserLocation();
  const { triggerAgentRegistrationPrompt } = useAgentRegistration();
  const { scheduleAgentVerificationForOneAgent, scheduleAgentVerificationForAllAgents } = useAgentVerificationScheduling();
  const [activeTab, setActiveTab] = useState('location');
  const [selectedAgentToPrompt, setSelectedAgentToPrompt] = useState({});
  const [floatBalance, setFloatBalance] = useState(0); // Mock balance for UI
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [showBuyVoucherModal, setShowBuyVoucherModal] = useState(false);
  const [showRedeemVoucherModal, setShowRedeemVoucherModal] = useState(false);
  const [selectedMerchant, setSelectedMerchant] = useState('');
  const [voucherValue, setVoucherValue] = useState('');
  const [voucherId, setVoucherId] = useState('');
  const [redeemAmount, setRedeemAmount] = useState('');
  const [salesAgentId, setSalesAgentId] = useState('');

  const handleTopUp = (e) => {
    e.preventDefault();
    // TODO: Integrate backend for top-up
    console.log('Top-up submitted');
    setShowTopUpModal(false);
    // Mock update balance
    setFloatBalance(prev => prev + parseFloat(e.target.amount.value));
  };

  const handleBuyVoucher = (e) => {
    e.preventDefault();
    if (parseFloat(voucherValue) > getTrustLimit(selectedMerchant)) {
      alert('Voucher value exceeds trust limit for this merchant.');
      return;
    }
    // TODO: Integrate backend for buying voucher
    console.log('Buy voucher submitted', { selectedMerchant, voucherValue });
    setShowBuyVoucherModal(false);
  };

  const handleRedeemVoucher = (e) => {
    e.preventDefault();
    if (parseFloat(redeemAmount) > floatBalance) {
      alert('Insufficient float balance to redeem this amount.');
      return;
    }
    // TODO: Integrate backend for redeeming voucher
    console.log('Redeem voucher submitted', { voucherId, redeemAmount });
    setShowRedeemVoucherModal(false);
    // Mock update balance
    setFloatBalance(prev => prev - parseFloat(redeemAmount));
  };

  const handleVerifyCash = () => {
    if (!salesAgentId) {
      alert('Please enter the sales agent ID for verification.');
      return;
    }
    // Trigger note verification with agentID
    startNoteVerification({ agentId: salesAgentId });
  };

  // Mock merchants and voucher options for UI demonstration
  const merchants = ['Merchant A', 'Merchant B', 'Merchant C'];
  const voucherOptions = [2000, 10000, 20000, 100000]; // Predefined values

  // Mock trust limit
  const getTrustLimit = (merchant) => {
    // In real, fetch based on merchant and user trust score
    return merchant ? 40000 : 0; // Example max
  };
  
  const [fetchAgents, { data: agentsData, isLoading: agentsLoading }] = useItemsListReadrMutation();
  const { Data: agentList } = agentsData || {};
  const [fetchCashNotes, { data: cashNotesResponse, isLoading: cashNotesLoading }] = useItemsListReadrMutation();
  const { Data: cashNotesVerificationsList, totalPages, currentPage } = cashNotesResponse || {};

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
              <p className="text-lg sm:text-2xl font-semibold text-lime-600">${floatBalance.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
          {/* Top-Up Card */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <FaPlus className="text-lime-600 text-3xl sm:text-4xl mb-4" />
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Top-Up Float</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-4">Add funds to your float wallet using Visa or Crypto.</p>
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
            <h2 className="text-lg sm:text-xl font-semibold mb-2">Buy Sales Voucher</h2>
            <p className="text-gray-600 text-sm sm:text-base mb-4">Purchase a voucher to sell on behalf of a merchant.</p>
            <button 
              onClick={() => setShowBuyVoucherModal(true)}
              className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 text-sm sm:text-base"
            >
              Buy Voucher
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

        {/* Top-Up Modal */}
        {showTopUpModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 sm:p-8 rounded-lg max-w-full sm:max-w-md w-full mx-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Top-Up Float Wallet</h2>
              <form onSubmit={handleTopUp} className="space-y-4">
                <select className="w-full px-3 py-2 border rounded text-sm sm:text-base">
                  <option>Visa Card</option>
                  <option>Crypto Transfer</option>
                </select>
                <input
                  type="number"
                  name="amount"
                  placeholder="Amount"
                  className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                  required
                />
                <div className="flex flex-col sm:flex-row sm:space-x-2">
                  <button type="submit" className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 text-sm sm:text-base">
                    Submit Top-Up
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowTopUpModal(false)}
                    className="mt-2 sm:mt-0 text-gray-600 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Buy Voucher Modal */}
        {showBuyVoucherModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
            <div className="bg-white p-4 sm:p-8 rounded-lg max-w-full sm:max-w-md w-full mx-4">
              <h2 className="text-lg sm:text-xl font-semibold mb-4">Buy Sales/Payment Voucher</h2>
              <form onSubmit={handleBuyVoucher} className="space-y-4">
                <select 
                  value={selectedMerchant}
                  onChange={(e) => setSelectedMerchant(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                  required
                >
                  <option value="">Select Merchant</option>
                  {merchants.map(m => <option key={m}>{m}</option>)}
                </select>
                {selectedMerchant && (
                  <p className="text-gray-600 text-sm sm:text-base">Max Trust Limit: ${getTrustLimit(selectedMerchant)}</p>
                )}
                <select 
                  value={voucherValue}
                  onChange={(e) => setVoucherValue(e.target.value)}
                  className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                  required
                >
                  <option value="">Select Voucher Value</option>
                  {voucherOptions.map(v => <option key={v} value={v}>R{v}</option>)}
                </select>
                <div className="flex flex-col sm:flex-row sm:space-x-2">
                  <button type="submit" className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 text-sm sm:text-base">
                    Buy Voucher
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowBuyVoucherModal(false)}
                    className="mt-2 sm:mt-0 text-gray-600 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
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
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(e.target.value)}
                  placeholder="Amount to Redeem"
                  className="w-full px-3 py-2 border rounded text-sm sm:text-base"
                  required
                />
                <div className="flex items-center space-x-2">
                  <FaMoneyCheckAlt className="text-lime-600 text-xl sm:text-2xl" />
                  <input
                    type="text"
                    value={salesAgentId}
                    onChange={(e) => setSalesAgentId(e.target.value)}
                    placeholder="Sales Agent ID for Cash Verification"
                    className="flex-grow px-3 py-2 border rounded text-sm sm:text-base"
                  />
                  <button 
                    type="button" 
                    onClick={handleVerifyCash}
                    className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded hover:bg-blue-700 text-sm sm:text-base"
                  >
                    Verify Cash
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:space-x-2">
                  <button type="submit" className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 text-sm sm:text-base">
                    Redeem Voucher
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setShowRedeemVoucherModal(false)}
                    className="mt-2 sm:mt-0 text-gray-600 text-sm sm:text-base"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentDashboard;