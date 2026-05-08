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
import { Body, Controller, HttpCode, Inject, Post } from '@nestjs/common';
import { ResourcesService } from './resources.service.js';
let ResourcesController = class ResourcesController {
    resourcesService;
    constructor(resourcesService) {
        this.resourcesService = resourcesService;
    }
    useResource(request) {
        return this.resourcesService.useResource(request);
    }
    recoverResources(request) {
        return this.resourcesService.recoverResources(request);
    }
};
__decorate([
    Post('use'),
    HttpCode(200),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], ResourcesController.prototype, "useResource", null);
__decorate([
    Post('recover'),
    HttpCode(200),
    __param(0, Body()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Object)
], ResourcesController.prototype, "recoverResources", null);
ResourcesController = __decorate([
    Controller('resources'),
    __param(0, Inject(ResourcesService)),
    __metadata("design:paramtypes", [ResourcesService])
], ResourcesController);
export { ResourcesController };
//# sourceMappingURL=resources.controller.js.map