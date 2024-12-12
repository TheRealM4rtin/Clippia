import React from 'react';
import { NodeProps, Handle, Position } from '@xyflow/react';
import { WindowData } from '@/types/window';
import { useAppStore } from '@/lib/store';
import { Session } from '@supabase/supabase-js';

interface PlanNodeData extends WindowData {
  session: Session | null;
  size: {
    width: number;
    height: number;
  };
  zIndex: number;
  data: WindowData & { type: 'plans' };
}

interface PlanProps extends NodeProps<PlanNodeData> {
  session: Session | null;
}

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

const PlanWindow: React.FC<PlanProps> = ({ data, id, session }) => {
  const { removeWindow, onNodesChange } = useAppStore();

  const handleClose = () => {
    removeWindow(id);
    onNodesChange([{ type: 'remove', id }]);
  };

  const handleSelectPlan = async (variantId: string) => {
    if (!session?.user) return;
    
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          userId: session.user.id,
          userEmail: session.user.email,
          variantId
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Checkout error:', error);
    }
  };

  return (
    <>
      <Handle type="target" position={Position.Left} />
      <div className="window" style={{ 
        width: data.size?.width ?? 400,
        height: data.size?.height ?? 'auto',
        zIndex: data.zIndex 
      }}>
        <div className="title-bar">
          <div className="title-bar-text">{data.title}</div>
          <div className="title-bar-controls">
            <button aria-label="Close" onClick={handleClose} />
          </div>
        </div>
        <div className="window-body">
          {SUBSCRIPTION_PLANS.map((plan) => (
            <div key={plan.id} style={{ marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold' }}>{plan.name}</div>
              <div>{plan.price}</div>
              <ul>
                {plan.features.map((feature, i) => (
                  <li key={i}>{feature}</li>
                ))}
              </ul>
              <button onClick={() => handleSelectPlan(plan.variantId!)}>
                Select {plan.name}
              </button>
            </div>
          ))}
        </div>
      </div>
      <Handle type="source" position={Position.Right} />
    </>
  );
};

export default PlanWindow;