import { getAllLayoutConfig, setAllLayoutConfig } from "@/config/originLayoutConfig";
import { useRouterParams } from "@/hooks/useRouterParams";
import { useAppStateStore } from "@/stores/useAppStateStore";
import { resetLayoutConfig, setLayoutConfig } from "@/services/apis/layout";
import type { LayoutCard, LayoutWithRouter } from "@/types";
import { createGlobalState } from "@vueuse/core";
import { ref } from "vue";

// Cards that require ADMIN permission to be visible in layout
const ADMIN_ONLY_CARDS = ["ShopAdminCard"];
// Cards that are hidden from ADMIN (admin sees admin version instead)
const USER_ONLY_CARDS = ["ShopCard"];

export const useLayoutConfigStore = createGlobalState(() => {
  const { currentRoutePath } = useRouterParams();
  const globalLayoutConfig = ref<LayoutWithRouter[]>(getAllLayoutConfig());

  const getPageLayoutConfig = (pageName: string) => {
    if (!pageName) pageName = currentRoutePath.value;
    const res = globalLayoutConfig.value.find((item) => item.page === pageName)?.items;
    if (!res) return [];

    // Filter cards by user role
    const { isAdmin } = useAppStateStore();
    if (!isAdmin.value) {
      // Non-admin: hide admin-only cards
      return res.filter((item) => !ADMIN_ONLY_CARDS.includes(item.type));
    } else {
      // Admin: hide user-only cards (admin has admin version)
      return res.filter((item) => !USER_ONLY_CARDS.includes(item.type));
    }
  };

  const deleteLayoutItem = (pageName: string, id: string) => {
    if (!pageName) pageName = currentRoutePath.value;
    const items = getPageLayoutConfig(pageName);
    let index = 0;
    for (const iterator of items) {
      if (iterator?.id === id) {
        return items.splice(index, 1)?.[0];
      }
      index++;
    }
    return null;
  };

  const insertLayoutItem = (pageName: string, card: LayoutCard, index?: number) => {
    if (!pageName) pageName = currentRoutePath.value;
    const items = getPageLayoutConfig(pageName);
    if (items) {
      if (index != null) {
        items.splice(index, 0, card);
      } else {
        items.push(card);
      }
    }
  };

  const moveCardItem = (pageName: string, sourceId: string, targetId: string) => {
    if (!pageName) pageName = currentRoutePath.value;
    const items = getPageLayoutConfig(pageName);
    const sourceIndex = getIndexById(pageName, sourceId);
    const targetIndex = getIndexById(pageName, targetId);
    items.splice(targetIndex, 0, items.splice(sourceIndex, 1)[0]);
  };

  const getIndexById = (pageName: string, id: string) => {
    if (!pageName) pageName = currentRoutePath.value;
    const items = getPageLayoutConfig(pageName);
    return items.findIndex((item) => item.id === id);
  };

  const getCardById = (pageName: string, id: string) => {
    if (!pageName) pageName = currentRoutePath.value;
    const items = getPageLayoutConfig(pageName);
    return items.find((item) => item.id === id);
  };

  const saveGlobalLayoutConfig = async () => {
    return await setLayoutConfig().execute({
      data: JSON.stringify(globalLayoutConfig.value)
    });
  };

  const resetGlobalLayoutConfig = async () => {
    return await resetLayoutConfig().execute();
  };

  const getSettingsConfig = async () => {
    return getAllLayoutConfig().find((v) => v.page === "__settings__");
  };

  const setSettingsConfig = async (config: IPageLayoutConfig) => {
    const layout = getAllLayoutConfig();
    const curIndex = layout.findIndex((v) => v.page === "__settings__");
    if (curIndex >= 0) {
      layout[curIndex] = config;
    } else {
      layout.push(config);
    }
    setAllLayoutConfig(layout);
    await saveGlobalLayoutConfig();
    setTimeout(() => window.location.reload(), 200);
  };

  return {
    setSettingsConfig,
    getSettingsConfig,
    resetGlobalLayoutConfig,
    getPageLayoutConfig,
    deleteLayoutItem,
    insertLayoutItem,
    getIndexById,
    getCardById,
    moveCardItem,
    saveGlobalLayoutConfig,
    globalLayoutConfig
  };
});
