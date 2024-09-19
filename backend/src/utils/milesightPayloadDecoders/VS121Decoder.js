import { log } from '../log.js';

import atob from 'atob'; // Decode base64 string
import { Buffer } from 'buffer'; // Node.js Buffer for binary data
import {readInt16LE, readUInt16LE} from '../typeHelpers.js'

function decodeBytes(bytes) {
    var decoded = {};
    var i;
    for (i = 0; i < bytes.length; ) {
        var channel_id = bytes[i++];
        var channel_type = bytes[i++];

        // PROTOCOL VESION
        if (channel_id === 0xff && channel_type === 0x01) {
            decoded.protocol_version = bytes[i];
            i += 1;
        }
        // SERIAL NUMBER
        else if (channel_id === 0xff && channel_type === 0x08) {
            decoded.sn = readSerialNumber(bytes.slice(i, i + 6));
            i += 6;
        }
        // HARDWARE VERSION
        else if (channel_id === 0xff && channel_type === 0x09) {
            decoded.hardware_version = readVersion(bytes.slice(i, i + 2));
            i += 2;
        }
        // FIRMWARE VERSION
        else if (channel_id === 0xff && channel_type === 0x1f) {
            decoded.firmware_version = readVersion(bytes.slice(i, i + 4));
            i += 4;
        }
        // PEOPLE COUNTER
        else if (channel_id === 0x04 && channel_type === 0xc9) {
            decoded.people_count_all = bytes[i];
            decoded.region_count = bytes[i + 1];
            var region = readUInt16BE(bytes.slice(i + 2, i + 4));
            for (var idx = 0; idx < decoded.region_count; idx++) {
                var tmp = "region_" + (idx + 1);
                decoded[tmp] = (region >> idx) & 1;
            }
            i += 4;
        }
        // PEOPLE IN/OUT
        else if (channel_id === 0x05 && channel_type === 0xcc) {
            decoded.people_in = readInt16LE(bytes.slice(i, i + 2));
            decoded.people_out = readInt16LE(bytes.slice(i + 2, i + 4));
            i += 4;
        }
        // PEOPLE MAX
        else if (channel_id === 0x06 && channel_type === 0xcd) {
            decoded.people_count_max = bytes[i];
            i += 1;
        }
        // REGION COUNTER
        else if (channel_id === 0x07 && channel_type === 0xd5) {
            decoded.region_1_count = bytes[i];
            decoded.region_2_count = bytes[i + 1];
            decoded.region_3_count = bytes[i + 2];
            decoded.region_4_count = bytes[i + 3];
            decoded.region_5_count = bytes[i + 4];
            decoded.region_6_count = bytes[i + 5];
            decoded.region_7_count = bytes[i + 6];
            decoded.region_8_count = bytes[i + 7];
            i += 8;
        }
        // REGION COUNTER
        else if (channel_id === 0x08 && channel_type === 0xd5) {
            decoded.region_9_count = bytes[i];
            decoded.region_10_count = bytes[i + 1];
            decoded.region_11_count = bytes[i + 2];
            decoded.region_12_count = bytes[i + 3];
            decoded.region_13_count = bytes[i + 4];
            decoded.region_14_count = bytes[i + 5];
            decoded.region_15_count = bytes[i + 6];
            decoded.region_16_count = bytes[i + 7];
            i += 8;
        }
        // A FLOW
        else if (channel_id === 0x09 && channel_type === 0xda) {
            decoded.a_to_a = readUInt16LE(bytes.slice(i, i + 2));
            decoded.a_to_b = readUInt16LE(bytes.slice(i + 2, i + 4));
            decoded.a_to_c = readUInt16LE(bytes.slice(i + 4, i + 6));
            decoded.a_to_d = readUInt16LE(bytes.slice(i + 6, i + 8));
            i += 8;
        }
        // B FLOW
        else if (channel_id === 0x0a && channel_type === 0xda) {
            decoded.b_to_a = readUInt16LE(bytes.slice(i, i + 2));
            decoded.b_to_b = readUInt16LE(bytes.slice(i + 2, i + 4));
            decoded.b_to_c = readUInt16LE(bytes.slice(i + 4, i + 6));
            decoded.b_to_d = readUInt16LE(bytes.slice(i + 6, i + 8));
            i += 8;
        }
        // C FLOW
        else if (channel_id === 0x0b && channel_type === 0xda) {
            decoded.c_to_a = readUInt16LE(bytes.slice(i, i + 2));
            decoded.c_to_b = readUInt16LE(bytes.slice(i + 2, i + 4));
            decoded.c_to_c = readUInt16LE(bytes.slice(i + 4, i + 6));
            decoded.c_to_d = readUInt16LE(bytes.slice(i + 6, i + 8));
            i += 8;
        }
        // D FLOW
        else if (channel_id === 0x0c && channel_type === 0xda) {
            decoded.d_to_a = readUInt16LE(bytes.slice(i, i + 2));
            decoded.d_to_b = readUInt16LE(bytes.slice(i + 2, i + 4));
            decoded.d_to_c = readUInt16LE(bytes.slice(i + 4, i + 6));
            decoded.d_to_d = readUInt16LE(bytes.slice(i + 6, i + 8));
            i += 8;
        }
        // TOTAL IN/OUT
        else if (channel_id === 0x0d && channel_type === 0xcc) {
            decoded.people_total_in = readUInt16LE(bytes.slice(i, i + 2));
            decoded.people_total_out = readUInt16LE(bytes.slice(i + 2, i + 4));
            i += 4;
        }
        // DWELL TIME
        else if (channel_id === 0x0e && channel_type === 0xe4) {
            var region = bytes[i];
            // decoded.region = region;
            decoded.dwell_time_avg = readUInt16LE(bytes.slice(i + 1, i + 3));
            decoded.dwell_time_max = readUInt16LE(bytes.slice(i + 3, i + 5));
            i += 5;
        }
        // TIMESTAMP
        else if (channel_id === 0x0f && channel_type === 0x85) {
            decoded.timestamp = readUInt32LE(bytes.slice(i, i + 4));
            i += 4;
        } else {
            break;
        }
    }

    return decoded;
}

export const decodePayloadVS121 = async (payload, encoded = "base64") => {
    log("VS121Decode:decodePayload payload received ");
    let bytes;
    if (encoded === "base64") {
        const binaryString = atob(payload);
        bytes = Buffer.from(binaryString, 'binary');
    } else if (encoded === "hex") {
        bytes = Buffer.from(payload, 'hex');
    } else {
        log("Unsupported encode type");
        return;
    }

    return decodeBytes(bytes);
}

function readUInt16BE(bytes) {
    var value = (bytes[0] << 8) + bytes[1];
    return value & 0xffff;
}

function readUInt32LE(bytes) {
    var value = (bytes[3] << 24) + (bytes[2] << 16) + (bytes[1] << 8) + bytes[0];
    return (value & 0xffffffff) >>> 0;
}

function readVersion(bytes) {
    var temp = [];
    for (var idx = 0; idx < bytes.length; idx++) {
        temp.push((bytes[idx] & 0xff).toString(10));
    }
    return temp.join(".");
}

function readSerialNumber(bytes) {
    var temp = [];
    for (var idx = 0; idx < bytes.length; idx++) {
        temp.push(("0" + (bytes[idx] & 0xff).toString(16)).slice(-2));
    }
    return temp.join("");
}