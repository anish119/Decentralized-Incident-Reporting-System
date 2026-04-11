import React from 'react';

const IPFS_GATEWAY = 'https://gateway.pinata.cloud/ipfs/';

/**
 * Renders the evidence image for a report.
 * Supports the standard imageCID field and handles the gateway URL logic.
 */
export default function EvidencePreview({ report, onImageClick }) {
    if (!report.imageCID || report.imageCID === 'NO_IMAGE') return null;

    const url = `${IPFS_GATEWAY}${report.imageCID}`;

    return (
        <div className="evidence-preview">
            <div className="evidence-item evidence-image">
                <img
                    src={url}
                    alt="Evidence"
                    onClick={() => onImageClick && onImageClick(url)}
                    style={{ cursor: onImageClick ? 'zoom-in' : 'default' }}
                />
            </div>
        </div>
    );
}
