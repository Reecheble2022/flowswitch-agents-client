import React, { useEffect, useState } from 'react';
import { CardElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { FaSpinner, FaCheck, FaTimes } from 'react-icons/fa';
import { useItemRegistrerMutation } from '../backend/api/sharedCrud';

// Props:
// - amount: The top-up amount (e.g., "10" for R10)
// - onCancel: Callback to close the modal
const StripeCardForm = ({ amount, onCancel, targetWalletDetails }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [cardError, setCardError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null); // null, 'success', 'error'
  const [submitNewPaymentIntentRequest, {
    data: newPaymentIntentData, 
    isLoading: newPaymentIntentProcessing, 
    isSuccess: newPaymentIntentSuccess, 
    isError: newPaymentIntentIsErr, 
    error: newPaymentIntentError,
  }] = useItemRegistrerMutation();
  const { Data: newPaymentIntentDetails } = newPaymentIntentData || {};
  useEffect(() => {
    if(newPaymentIntentSuccess && newPaymentIntentDetails && !newPaymentIntentProcessing){
        const { clientSecret, cardHolderName } = newPaymentIntentDetails;
        confirmStripePayment({ clientSecret, cardHolderName })
    }
    if (newPaymentIntentIsErr) {
        setIsSubmitting(false);
        setCardError(newPaymentIntentError);
    }
  },[newPaymentIntentSuccess, newPaymentIntentProcessing])

  const handleSubmitStripePaymentIntent = async (e) => {
    e.preventDefault();
    if (!stripe || !elements) {
      setCardError('Stripe.js has not loaded. Please try again.');
      return;
    }
    setIsSubmitting(true);
    setCardError(null);
    setPaymentStatus(null);
    try {
      const cardHolderName = e.target.cardHolder.value
      submitNewPaymentIntentRequest({
        entity: "floatwallet",
        submissionEndpoint: "floatwallet/paymentintent",
        data: { amount, cardHolderName, targetWalletDetails }
      })
    } catch (err) {
      setCardError('An unexpected error occurred. Please try again.');
      setPaymentStatus('error');
      setIsSubmitting(false);
    }
  };

  const confirmStripePayment = async ({ clientSecret, cardHolderName }) => {
    const cardElement = elements.getElement(CardElement);
    const { paymentIntent, error: confirmationError } = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
            card: cardElement,
            billing_details: {
              name: cardHolderName
            },
        },
    });
    if (paymentIntent.status === 'succeeded') {
        setPaymentStatus('success');
        setTimeout(() => onCancel(), 3000);
    }
    if (confirmationError) {
        setCardError(confirmationError.message);
        setPaymentStatus('error');
        setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmitStripePaymentIntent} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Cardholder Name</label>
        <input
          type="text"
          name="cardHolder"
          placeholder="Cardholder Name"
          className="w-full px-3 py-2 border rounded text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-lime-600"
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Card Details</label>
        <div className="w-full px-3 py-2 border rounded text-sm sm:text-base">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': { color: '#aab7c4' },
                },
                invalid: { color: '#9e2146' },
              },
            }}
            className="p-2"
          />
        </div>
        {cardError && <div className="text-red-600 text-sm mt-2">{cardError}</div>}
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Amount (ZAR)</label>
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          value={amount}
          disabled
          className="w-full px-3 py-2 border rounded text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-lime-600"
          required
        />
      </div>
      <div className="flex flex-col sm:flex-row sm:space-x-2">
        <button
          type="submit"
          disabled={isSubmitting || !stripe || !elements}
          className="bg-lime-600 text-white px-4 py-2 rounded hover:bg-lime-700 text-sm sm:text-base disabled:bg-gray-400"
        >
          Submit Top-Up
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="mt-2 sm:mt-0 text-gray-600 text-sm sm:text-base"
        >
          Cancel
        </button>
      </div>
      {isSubmitting && (
        <div className="text-center flex items-center justify-center">
          <FaSpinner className="animate-spin text-lime-600 mr-2" /> Processing...
        </div>
      )}
      {!isSubmitting && paymentStatus && (
        <div className={`flex items-center justify-between ${paymentStatus === 'success' ? 'text-green-600' : 'text-red-600'}`}>
          <span>
            {paymentStatus === 'success' ? <FaCheck className="inline mr-1" /> : <FaTimes className="inline mr-1" />}
            {paymentStatus === 'success' ? 'Top-Up Successful' : 'Top-Up Failed'}
          </span>
          <span onClick={onCancel} className="cursor-pointer">x</span>
        </div>
      )}
    </form>
  );
};

export default StripeCardForm;