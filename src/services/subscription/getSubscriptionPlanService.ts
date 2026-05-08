import { axiosInstance } from '@/config/axios';
import { ApiResponse } from '@/types/payment/payment';
import { SubscriptionPlan, FarmSubscription } from '@/types/subscription/subscription';

class GetSubscriptionPlansService {
    async getPlans(): Promise<ApiResponse<SubscriptionPlan[]>> {
        const response = await axiosInstance.get('/api/v1/subscriptions');
        return response.data;
    }

    async getHistory(): Promise<ApiResponse<FarmSubscription[]>> {
        const response = await axiosInstance.get('/api/v1/subscriptions/history');
        return response.data;
    }

    async getCurrent(): Promise<ApiResponse<FarmSubscription>> {
        const response = await axiosInstance.get('/api/v1/subscriptions/current');
        return response.data;
    }

    async createSubscription(data: { subscriptionPlanId: string; farmId: string }): Promise<ApiResponse<any>> {
        const response = await axiosInstance.put('/api/v1/subscriptions', data);
        return response.data;
    }
}

export const getSubscriptionPlansService = new GetSubscriptionPlansService();
