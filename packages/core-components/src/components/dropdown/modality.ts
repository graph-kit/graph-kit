import { InjectionKey, Ref } from 'vue';

/**
 * whether the open menu is being driven by a pointer. submenus are portaled out of the
 * menu that owns them, so their events never reach it and they report in through here
 */
export const menuUsingPointerKey: InjectionKey<Ref<boolean>> = Symbol(
  'dropdown-using-pointer',
);
