export async function upsertStepTime(client: any, businessYearId: string, stepId: string, value: number, userId?: string) {
  return client.rpc('rd_client_upsert_step_override', { p_business_year_id: businessYearId, p_step_id: stepId, p_value: value, p_user: userId || null });
}

export async function upsertSubFrequency(client: any, businessYearId: string, subId: string, value: number, userId?: string) {
  return client.rpc('rd_client_upsert_subcomponent_override', { p_business_year_id: businessYearId, p_sub_id: subId, p_value: value, p_user: userId || null });
}

export async function upsertActivityPractice(client: any, businessYearId: string, activityId: string, value: number, userId?: string) {
  return client.rpc('rd_client_upsert_activity_override', { p_business_year_id: businessYearId, p_activity_id: activityId, p_value: value, p_user: userId || null });
}


