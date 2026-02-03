// HubSpot API response types
export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string;
    amount: string;
    dealstage: string;
    closedate: string;
    createdate: string;
    hs_lastmodifieddate: string;
    hubspot_owner_id?: string;
    dealowner?: string;
    hubspot_owner_email?: string;
    pipeline?: string;
    hs_forecast_probability?: string;
  };
}

export interface HubSpotPipelineStage {
  id: string;
  label: string;
  displayOrder: number;
  metadata: {
    probability?: string;
  };
}
