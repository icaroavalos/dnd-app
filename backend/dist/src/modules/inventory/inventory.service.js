var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { RulesService } from '../rules/rules.service.js';
import { countAmmoInInventory, normalizeInventoryQuantity, resolveAmmoGroup, slugify } from './ammo-rules.js';
let InventoryService = class InventoryService {
    rulesService;
    constructor(rulesService) {
        this.rulesService = rulesService;
    }
    async spendAmmo(request) {
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
    async recoverAmmo(request) {
        const amount = Math.max(1, Math.floor(request.amount ?? 1));
        const { ammoGroup } = await this.resolveWeaponAmmoContext(request.character, request.weaponItemId);
        const existingIndex = request.character.inventory.findIndex((inventoryItem) => slugify(inventoryItem.baseItemId) === ammoGroup.preferredBaseItemId);
        if (existingIndex >= 0) {
            return {
                ...request.character,
                inventory: request.character.inventory.map((inventoryItem, index) => index === existingIndex
                    ? {
                        ...inventoryItem,
                        quantity: normalizeInventoryQuantity(inventoryItem.quantity) + amount
                    }
                    : inventoryItem)
            };
        }
        const recoveredItem = {
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
    async resolveWeaponAmmoContext(character, weaponItemId) {
        const weapon = character.inventory.find((inventoryItem) => inventoryItem.instanceId === weaponItemId);
        if (!weapon) {
            throw new NotFoundException({
                code: 'WEAPON_NOT_FOUND',
                message: `Weapon item "${weaponItemId}" does not exist on this character.`
            });
        }
        const itemsCatalog = await this.rulesService.getCatalog('items');
        const itemDetail = itemsCatalog.results.find((entry) => slugify(entry.name) === slugify(weapon.baseItemId));
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
};
InventoryService = __decorate([
    Injectable(),
    __param(0, Inject(RulesService)),
    __metadata("design:paramtypes", [RulesService])
], InventoryService);
export { InventoryService };
//# sourceMappingURL=inventory.service.js.map