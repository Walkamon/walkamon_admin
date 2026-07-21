import axiosClient from "../utils/axiosClient";

export const pvpSprintAdminApi = {
  // GET /api/admin/pvp/sprint/reward-rules
  getRewardRules: () => {
    return axiosClient.get("/api/admin/pvp/sprint/reward-rules");
  },

  // PUT /api/admin/pvp/sprint/reward-rules
  updateRewardRules: (payload) => {
    return axiosClient.put("/api/admin/pvp/sprint/reward-rules", payload);
  },
  // GET /api/admin/pvp/sprint/item-effects
  getItemEffects: () => {
    return axiosClient.get("/api/admin/pvp/sprint/item-effects");
  },

  // PUT /api/admin/pvp/sprint/item-effects
  updateItemEffects: (payload) => {
    return axiosClient.put("/api/admin/pvp/sprint/item-effects", payload);
  },

  // GET /api/admin/pvp/sprint/rank-tiers
  getRankTiers: () => {
    return axiosClient.get("/api/admin/pvp/sprint/rank-tiers");
  },

  // PUT /api/admin/pvp/sprint/rank-tiers
  updateRankTiers: (payload) => {
    return axiosClient.put("/api/admin/pvp/sprint/rank-tiers", payload);
  },

  // GET /api/admin/pvp/sprint/spirit-rules
  getSpiritRules: () => {
    return axiosClient.get("/api/admin/pvp/sprint/spirit-rules");
  },

  // PUT /api/admin/pvp/sprint/spirit-rules
  updateSpiritRules: (payload) => {
    return axiosClient.put("/api/admin/pvp/sprint/spirit-rules", payload);
  },
};

export default pvpSprintAdminApi;
