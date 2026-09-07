import React from 'react';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

const MCI_GLYPHS = MaterialCommunityIcons.glyphMap as Record<string, unknown>;

/** Resolves an icon name across Ionicons + MaterialCommunityIcons. */
export function SIcon({
  name,
  size = 20,
  color = '#5B67F1',
}: {
  name: string;
  size?: number;
  color?: string;
}) {
  if (name && name in MCI_GLYPHS) {
    return <MaterialCommunityIcons name={name as never} size={size} color={color} />;
  }
  return <Ionicons name={name as never} size={size} color={color} />;
}
