import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import farmReducer from './farmSlice';
import plotReducer from './plotSlice';
import cropReducer from './cropSlice';
import seasonPlanReducer from './seasonPlanSlice';
import memberReducer from './memberSlice';
import warehouseReducer from './warehouseSlice';
import warehouseItemReducer from './warehouseItemSlice';
import supplierReducer from './supplierSlice';
import skuReducer from './skuSlice';
import unitReducer from './unitSlice';
import taskMaterialReducer from './taskMaterialSlice';
import taskAssigneeReducer from './taskAssigneeSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    farm: farmReducer,
    plot: plotReducer,
    crop: cropReducer,
    seasonPlan: seasonPlanReducer,
    member: memberReducer,
    warehouse: warehouseReducer,
    warehouseItem: warehouseItemReducer,
    supplier: supplierReducer,
    sku: skuReducer,
    unit: unitReducer,
    taskMaterial: taskMaterialReducer,
    taskAssignee: taskAssigneeReducer,
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;