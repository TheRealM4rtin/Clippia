import React, { useRef, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { useAppStore } from '@/lib/store';
import commonStyles from '../style/common.module.css';
import { Session } from '@supabase/supabase-js';

const SUBSCRIPTION_PLANS = [
  {
    id: 'basic',
    name: 'Basic Cloud Tier',
    price: '€3.99/month',
    features: ['Cloud storage', 'Basic features'],
    variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_BASIC_VARIANT_ID
  },
  {
    id: 'early_adopter',
    name: 'Early Adopter Tier',
    price: '€9.99/month',
    features: ['Cloud storage', 'Basic features', 'Future AI features'],
    variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_EARLY_ADOPTER_VARIANT_ID
  },
  {
    id: 'support',
    name: 'Support Tier',
    price: '€15.00/month',
    features: ['Cloud storage', 'Basic features', 'Future AI features', 'Priority support'],
    variantId: process.env.NEXT_PUBLIC_LEMON_SQUEEZY_SUPPORT_VARIANT_ID
  }
];

interface SelectPlansWindowProps extends NodeProps {
  data: {
    session: Session;
    onError: (error: string) => void;
    zIndex: number;
  };
}

const SelectPlansWindow: React.FC<SelectPlansWindowProps> = ({ id, data }) => {
  const { updateWindow, removeWindow, windows: { windows } } = useAppStore();
  const nodeRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const handleClick = () => {
    const highestZIndex = Math.max(...windows.map(w => w.zIndex || 0)) + 1;
    updateWindow(id, { zIndex: highestZIndex });
  };

  const handleClose = () => {
    removeWindow(id);
  };

  const handleSelectPlan = async (variantId: string) => {
    if (!data.session?.user) {
      data.onError('Please sign in to purchase a plan');
      return;
    }

    try {
      setIsLoading(variantId);

      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${data.session.access_token}`,
        },
        body: JSON.stringify({ 
          userId: data.session.user.id,
          userEmail: data.session.user.email,
          variantId: variantId.toString()
        })
      });

      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to create checkout session');
      }

      if (responseData.url) {
        window.location.href = responseData.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
      data.onError(error instanceof Error ? error.message : 'Failed to process checkout');
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div 
      ref={nodeRef} 
      className={commonStyles.window}
      onClick={handleClick}
      style={{ zIndex: data.zIndex as number }}
    >
      <div className={commonStyles.titleBar}>
        <div className={commonStyles.titleBarText}>Select Plan</div>
        <div className="title-bar-controls">
          <button aria-label="Close" onClick={handleClose} />
        </div>
      </div>
      <div className={commonStyles.windowBody}>
        {SUBSCRIPTION_PLANS.map((plan) => (
          <div key={plan.id} style={{ marginBottom: '16px' }}>
            <div style={{ fontWeight: 'bold' }}>{plan.name}</div>
            <div>{plan.price}</div>
            <ul>
              {plan.features.map((feature, i) => (
                <li key={i}>{feature}</li>
              ))}
            </ul>
            <button 
              className="button"
              onClick={() => handleSelectPlan(plan.variantId!)}
              disabled={isLoading === plan.variantId}
            >
              {isLoading === plan.variantId ? 'Processing...' : `Select ${plan.name}`}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SelectPlansWindow;