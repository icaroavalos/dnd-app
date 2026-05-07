export interface FeatureResourceView {
    id: string;
    remaining: number;
    max: number;
    recoveryLabel: string;
}
export interface FeatureItem {
    id: string;
    name: string;
    kind: string;
    meta?: string;
    description: string;
    resource?: FeatureResourceView;
}
export declare function renderFeaturesSheet(items: FeatureItem[], filter: string, selectedFeatureId: string): string;
//# sourceMappingURL=features-view.d.ts.map