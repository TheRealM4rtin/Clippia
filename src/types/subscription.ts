import type { Database } from './database.types'

// Core types from database
export type SubscriptionTier = Database['public']['Enums']['subscription_tier']
export type SubscriptionStatus = Database['public']['Enums']['subscription_status']

export interface Subscription {
  id: string
  user_id: string | null
  plan: 'basic' | 'pro' | 'enterprise'
  status: SubscriptionStatus
  subscription_id: string
  current_period_end: string | null
  created_at: string | null
  updated_at: string | null
}

export interface SubscriptionQuota {
  storage_limit_mb: number
  max_boards: number
  max_collaborators_per_board: number
  feature_flags: string[]
}

export interface WebhookEvent {
  id: string
  created_at: string
  event_type: string
  payload: {
    meta: {
      test_mode: boolean
      event_name: string
      custom_data: Record<string, string | number | boolean | null>
    }
    attributes: {
      store_id: number
      customer_id: number
      subscription_id: number
      status: string
      variant_id: number
      product_id: number
      user_name: string
      user_email: string
      [key: string]: string | number | boolean | null
    }
  }
  processed?: boolean
  processed_at?: string
  error_message?: string
  retry_count?: number
}

export const SUBSCRIPTION_TIERS: Record<SubscriptionTier, SubscriptionQuota> = {
  basic: {
    storage_limit_mb: 100,
    max_boards: 1,
    max_collaborators_per_board: 0,
    feature_flags: ['basic_editing']
  },
  early_adopter: {
    storage_limit_mb: 1000,
    max_boards: 5,
    max_collaborators_per_board: 3,
    feature_flags: ['basic_editing', 'cloud_storage', 'collaboration']
  },
  support: {
    storage_limit_mb: 5000,
    max_boards: 20,
    max_collaborators_per_board: 10,
    feature_flags: ['basic_editing', 'cloud_storage', 'collaboration', 'advanced_features']
  }
}