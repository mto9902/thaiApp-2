import { memo, useMemo } from "react";
import { SvgXml } from "react-native-svg";

import { AppSketch } from "@/constants/theme-app";

const ICON_XML = {
  alphabet:
    '<?xml version="1.0" encoding="utf-8" ?><svg baseProfile="full" height="48" version="1.1" viewBox="0,0,48,48" width="48" xmlns="http://www.w3.org/2000/svg"><defs /><text fill="#4A5568" font-family="sans-serif" font-size="40" font-weight="700" text-anchor="middle" x="24" y="36">\u0E01</text></svg>',
  numbers:
    '<?xml version="1.0" encoding="utf-8" ?><svg baseProfile="full" height="48" version="1.1" viewBox="0,0,48,48" width="48" xmlns="http://www.w3.org/2000/svg"><defs /><text fill="#4A5568" font-family="sans-serif" font-size="40" font-weight="700" text-anchor="middle" x="24" y="36">\u0E51</text></svg>',
} as const;

export type KimiIconName = keyof typeof ICON_XML;

function tintXml(xml: string, color: string) {
  return xml.replaceAll("#4A5568", color);
}

type Props = {
  name: KimiIconName;
  size?: number;
  color?: string;
};

function KimiIcon({
  name,
  size = 20,
  color = AppSketch.inkMuted,
}: Props) {
  const xml = useMemo(() => tintXml(ICON_XML[name], color), [color, name]);

  return <SvgXml xml={xml} width={size} height={size} />;
}

export default memo(KimiIcon);
