import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';

import type { CharacterInventoryItem, CharacterRecord } from '../../domain/contracts/index.js';
import { RulesService } from '../rules/rules.service.js';
import {
  countAmmoInInventory,
  normalizeInventoryQuantity,
  resolveAmmoGroup,
  slugify,
  type AmmoGroup
} from './ammo-rules.js';

interface ItemCatalogEntry {
  name: string;
  property?: string[];
}

export interface SpendAmmoRequest {
  character: CharacterRecord;
  weaponItemId: string;
  amount?: number;
}

export interface RecoverAmmoRequest {
  character: CharacterRecord;
  weaponItemId: string;
  amount?: number;
}

@Injectable()
export class InventoryService {
  constructor(
    @Inject(RulesService)
    private readonly rulesService: RulesService
  ) {}

  async spendAmmo(request: SpendAmmoRequest): Promise<CharacterRecord> {
    const amount = Math.max(1, Math.floor(request.amount ?? 1));
    const { ammoGroup } = await this.resolveWeaponAmmoContext(request.character, request.weaponItemId);
    const available = countAmmoInInventory(request.character.inventory, ammoGroup);

    if (available < amount) {
      throw new ConflictException({
        code: 'AMMO_UNAVAILABLE',
        message: `Not enough ammunition is available for weapon "${request.weaponItemId}".`
      });
    }

    let remainingToSpend = amount;
    const updatedInventory = request.character.inventory.flatMap((inventoryItem) => {
      if (!ammoGroup.acceptedBaseItemIds.includes(slugify(inventoryItem.baseItemId))) {
        return [inventoryItem];
      }

      const availableInEntry = normalizeInventoryQuantity(inventoryItem.quantity);
      const spent = Math.min(remainingToSpend, availableInEntry);
      remainingToSpend -= spent;
      const nextQuantity = availableInEntry - spent;

      if (nextQuantity <= 0) {
        return [];
      }

      return [
        {
          ...inventoryItem,
          quantity: nextQuantity
        }
      ];
    });

    return {
      ...request.character,
      inventory: updatedInventory
    };
  }

  async recoverAmmo(request: RecoverAmmoRequest): Promise<CharacterRecord> {
    const amount = Math.max(1, Math.floor(request.amount ?? 1));
    const { ammoGroup } = await this.resolveWeaponAmmoContext(request.character, request.weaponItemId);

    const existingIndex = request.character.inventory.findIndex(
      (inventoryItem) => slugify(inventoryItem.baseItemId) === ammoGroup.preferredBaseItemId
    );

    if (existingIndex >= 0) {
      return {
        ...request.character,
        inventory: request.character.inventory.map((inventoryItem, index) =>
          index === existingIndex
            ? {
                ...inventoryItem,
                quantity: normalizeInventoryQuantity(inventoryItem.quantity) + amount
              }
            : inventoryItem
        )
      };
    }

    const recoveredItem: CharacterInventoryItem = {
      instanceId: `item-inst-${ammoGroup.preferredBaseItemId}-${request.character.inventory.length + 1}`,
      baseItemId: ammoGroup.preferredBaseItemId,
      status: 'backpack',
      quantity: amount
    };

    return {
      ...request.character,
      inventory: [...request.character.inventory, recoveredItem]
    };
  }

  private async resolveWeaponAmmoContext(
    character: CharacterRecord,
    weaponItemId: string
  ): Promise<{ weapon: CharacterInventoryItem; ammoGroup: AmmoGroup }> {
    const weapon = character.inventory.find((inventoryItem) => inventoryItem.instanceId === weaponItemId);
    if (!weapon) {
      throw new NotFoundException({
        code: 'WEAPON_NOT_FOUND',
        message: `Weapon item "${weaponItemId}" does not exist on this character.`
      });
    }

    const itemsCatalog = await this.rulesService.getCatalog('items');
    const itemDetail = (itemsCatalog.results as ItemCatalogEntry[]).find(
      (entry) => slugify(entry.name) === slugify(weapon.baseItemId)
    );

    if (!itemDetail) {
      throw new NotFoundException({
        code: 'WEAPON_RULE_NOT_FOUND',
        message: `Rule data for weapon "${weapon.baseItemId}" was not found in the local compacted catalog.`
      });
    }

    const ammoGroup = resolveAmmoGroup(itemDetail);
    if (!ammoGroup) {
      throw new ConflictException({
        code: 'AMMO_NOT_REQUIRED',
        message: `Weapon "${weapon.baseItemId}" does not require ammunition.`
      });
    }

    return { weapon, ammoGroup };
  }
}
